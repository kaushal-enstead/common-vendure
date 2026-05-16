import { Resolver, Mutation, Args, ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Ctx,
  Allow,
  Permission,
  RequestContext,
  OrderService,
  EntityHydrator,
  TransactionalConnection,
  GlobalSettingsService,
  Seller,
  Logger,
} from '@vendure/core';
import { EasypaySdkService } from '../services/easypay-sdk.service';

@ObjectType()
export class EasypayCheckoutResult {
  @Field() session: string;
  @Field() id: string;
  @Field() config: any;
}

@Resolver()
export class EasypaySdkShopResolver {
  constructor(
    private easypaySdkService: EasypaySdkService,
    private orderService: OrderService,
    private connection: TransactionalConnection,
    private hydrator: EntityHydrator,
    private globalSettings: GlobalSettingsService,
  ) {}

  @Mutation(() => EasypayCheckoutResult)
  //   @Allow(Permission.Public)
  async createEasypayCheckout(
    @Ctx() ctx: RequestContext,
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<EasypayCheckoutResult> {
    // 1) Carrega a order
    const order = await this.orderService.findOne(ctx, orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // 2) Hidratar relações
    await this.hydrator.hydrate(ctx, order, {
      relations: [
        'customer',
        'shippingAddress',
        'lines',
        'shippingLines',
        'shippingLines.shippingMethod',
        'shippingLines.shippingMethod.channels',
        'shippingLines.shippingMethod.channels.customFields',
      ] as any,
    });

    // 3) Detetar cenário real (múltiplas shipping lines)
    type ShippingLineLike = { shippingMethod?: { fulfillmentHandlerCode?: string } | null };

    const lines = ((order as any).shippingLines ?? []) as ShippingLineLike[];

    const hasCourier = lines.some(sl => sl.shippingMethod?.fulfillmentHandlerCode === 'courier-fulfillment');
    const hasNonCourier = lines.some(
      sl => sl.shippingMethod?.fulfillmentHandlerCode !== 'courier-fulfillment',
    );

    const scenario = hasCourier && hasNonCourier ? 'mixed' : hasCourier ? 'all-courier' : 'all-non-courier';

    Logger.info(`[Easypay] Scenario=${scenario}`, 'easypay');

    // 4) Splits filtrados conforme o cenário
    let splits: any[] = [];
    if (scenario === 'all-non-courier') {
      // Todos os sellers não-courier → capturar já tudo
      splits = await this.computeSplits(ctx, order, {
        includePredicate: (_sellerId, fh) => fh !== 'courier-fulfillment',
      });
    } else if (scenario === 'mixed') {
      // Capturar já **só** a parte não-courier; o courier fica para o fluxo courier
      splits = await this.computeSplits(ctx, order, {
        includePredicate: (_sellerId, fh) => fh !== 'courier-fulfillment',
      });
    } else {
      // all-courier → sem splits agora (tudo capturado no fluxo courier)
      splits = [];
    }

    // 5) Cria checkout (sempre authorisation). O SDK captura agora se receber splits.
    const amount = order.totalWithTax;
    const { metadata } = await this.easypaySdkService.createCheckoutForOrder(ctx, order, amount, {
      capture: {
        descriptive: `Order ${order.code}`,
        transaction_key: order.code,
        splits,
      },
    });

    if (!metadata.session) {
      throw new Error('EasyPay session not created. Check the plugin.');
    }

    return {
      session: metadata.session,
      id: metadata.id,
      config: metadata.config,
    };
  }

  @Mutation(() => Boolean)
  // @Allow(Permission.Public)
  async cancelEasypayCheckout(
    @Ctx() ctx: RequestContext,
    @Args('checkoutId') checkoutId: string,
  ): Promise<boolean> {
    return this.easypaySdkService.cancelCheckout(ctx, checkoutId);
  }

  private async computeSplits(
    ctx: RequestContext,
    order: any,
    opts?: { includePredicate?: (sellerId: string, sellerFhCode?: string) => boolean },
  ): Promise<any[]> {
    const fmt = (cents: number) =>
      new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    // 1) Hidratar o que precisamos
    await this.hydrator.hydrate(ctx, order, {
      relations: [
        'shippingLines',
        'shippingLines.shippingMethod',
        'shippingLines.shippingMethod.channels',
        'lines',
        'lines.productVariant',
        'lines.productVariant.product',
        'lines.productVariant.product.channels',
        'lines.productVariant.product.channels.customFields',
      ] as any,
    });

    // 2) Settings de plataforma
    const settings = await this.globalSettings.getSettings(ctx);
    const cf: any = (settings as any).customFields || {};

    const percentFee = (() => {
      const v = cf.percentageFee;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const s = v
          .replace(/[^\d,.\-]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : 0;
      }
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    })();
    const percentFeeClamped = Math.max(0, Math.min(100, percentFee));

    const fixedFeeCents = (() => {
      const v = cf.fixedFee;
      if (typeof v === 'number') return Number.isInteger(v) ? v : Math.round(v * 100);
      if (typeof v === 'string') {
        const raw = v.trim();
        const hasDecimal = /[.,]/.test(raw);
        if (!hasDecimal) {
          const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
          return Number.isFinite(n) ? n : 0;
        }
        const euros =
          parseFloat(
            raw
              .replace(/[^\d,.\-]/g, '')
              .replace(/\./g, '')
              .replace(',', '.'),
          ) || 0;
        return Math.round(euros * 100);
      }
      return 0;
    })();

    const platformAccount = cf.easypayAccountUid as string;
    if (!platformAccount) {
      throw new Error('Missing EasyPay platform account UID in global settings');
    }

    // Helper: fulfillment handler code do seller com base nas shippingLines
    const getSellerFhCode = (sellerId: string): string | undefined => {
      const sl = (order.shippingLines ?? []).find(
        (s: any) => s?.shippingMethod?.channels?.[0]?.sellerId === sellerId,
      );
      return sl?.shippingMethod?.fulfillmentHandlerCode;
    };

    // 3) Agrupar GROSS por seller **somente do subset incluído**
    const bySeller = new Map<string, { gross: number; accountId: string }>();
    let subsetTotalCents = 0;

    // 3.a) Product lines
    for (const line of order.lines) {
      const prod: any = line.productVariant.product;
      const chan = prod.channels?.[0];
      if (!chan || !chan.sellerId) {
        throw new Error(`Product ${prod.id} missing channel/sellerId`);
      }
      const sellerId = chan.sellerId as string;
      const sellerFh = getSellerFhCode(sellerId);

      if (opts?.includePredicate && !opts.includePredicate(sellerId, sellerFh)) continue;

      const seller = await this.connection
        .getRepository(ctx, Seller)
        .findOne({ where: { id: sellerId }, relations: ['customFields'] });
      const sellerAccount = (seller as any)?.customFields?.connectedAccountId;
      if (!sellerAccount) {
        throw new Error(`Seller ${sellerId} sem connectedAccountId no customFields`);
      }

      const grossLine = Math.round(line.unitPriceWithTax * line.quantity);
      subsetTotalCents += grossLine;

      const entry = bySeller.get(sellerId) ?? { gross: 0, accountId: sellerAccount };
      entry.gross += grossLine;
      bySeller.set(sellerId, entry);
    }

    // 3.b) Shipping por seller (só subset incluído)
    for (const sl of order.shippingLines ?? []) {
      const sm: any = sl.shippingMethod;
      if (!sm) continue;

      const chan: any = sm.channels?.[0];
      const shipSellerId: string | undefined = chan?.sellerId;
      if (!shipSellerId || !bySeller.has(shipSellerId)) continue;

      const sellerFh = getSellerFhCode(shipSellerId);
      if (opts?.includePredicate && !opts.includePredicate(shipSellerId, sellerFh)) continue;

      const slCents = Math.round((sl as any).discountedPriceWithTax ?? (sl as any).priceWithTax ?? 0);
      subsetTotalCents += slCents;

      const entry = bySeller.get(shipSellerId)!;
      entry.gross += slCents; // 100% of this seller's shipping
      bySeller.set(shipSellerId, entry);
    }

    if (subsetTotalCents < 2 || bySeller.size === 0) {
      Logger.info('[EasyPay Split] Subset vazio/irrelevante. Sem splits.', 'easypay');
      return [];
    }

    // 4) Platform fee calculated ABOUT SUBSET
    const sellerCount = bySeller.size;
    const percentCents = Math.round(subsetTotalCents * (percentFeeClamped / 100));
    let platformFeeCents = percentCents + fixedFeeCents * sellerCount;
    if (platformFeeCents < 1) platformFeeCents = 1;

    // 5) Proportional distribution by seller
    let sumSellerNet = 0;
    const sellerSplits: any[] = [];
    for (const [sellerId, { gross, accountId }] of bySeller) {
      const share = Math.round(platformFeeCents * (gross / subsetTotalCents));
      const sellerNet = gross - share;
      sumSellerNet += sellerNet;
      sellerSplits.push({
        split_key: `split-seller-${sellerId}`,
        split_descriptive: `Seller ${sellerId}`,
        value: +(sellerNet / 100).toFixed(2),
        account: { id: accountId },
      });
    }

    // 6) Drift goes to platform
    const drift = subsetTotalCents - (sumSellerNet + platformFeeCents);
    const platformValue = +((platformFeeCents + drift) / 100).toFixed(2);

    Logger.info(
      `[EasyPay Split] Subset total=${fmt(subsetTotalCents)} → sellers=${fmt(sumSellerNet)}, platform=${fmt(platformFeeCents + drift)}`,
      'split',
    );

    const platformSplit = {
      split_key: 'split-platform',
      split_descriptive: 'Platform fee',
      value: platformValue,
      account: { id: platformAccount },
    };

    return [...sellerSplits, platformSplit];
  }
}

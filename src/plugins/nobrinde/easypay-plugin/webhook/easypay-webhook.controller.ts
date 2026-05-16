import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  OrderService,
  RequestContextService,
  LanguageCode,
  TransactionalConnection,
  Order,
  PaymentMethod,
  Logger,
  Seller,
  GlobalSettingsService,
} from '@vendure/core';
import { EasypaySdkService } from '../services/easypay-sdk.service';
import { EASYPAY_METHOD_CODE } from '../constants';

@Controller('webhooks')
export class EasypayWebhookController {
  constructor(
    private readonly orderService: OrderService,
    private readonly requestContextService: RequestContextService,
    private readonly connection: TransactionalConnection,
    private readonly easypaySdkService: EasypaySdkService,
    private readonly globalSettings: GlobalSettingsService,
  ) {}

  @Post('easypay')
  async handleWebhook(@Body() body: any, @Headers('authorization') signature: string, @Res() res: Response) {
    try {
      Logger.info(`[EASYPAY] Payload recebido:\n${JSON.stringify(body, null, 2)}`, 'easypay-webhook');

      // 1) Extracts main fields
      let transactionId = body.id as string;
      const eventStatus = body.status as 'success' | 'failed' | undefined;
      const orderCode = body.key as string;

      // 2) Detects event type from various possible locations
      let eventType: 'authorisation' | 'capture' | 'sale' | undefined = body.type; // root first
      if (!eventType) {
        if (body.authorisation?.id) {
          eventType = 'authorisation';
        } else if (body.capture?.id) {
          eventType = 'capture';
        } else if (body.sale?.id) {
          eventType = 'sale';
        } else if (body.transaction?.type) {
          eventType = body.transaction.type as 'authorisation' | 'capture' | 'sale' | undefined;
          if (!transactionId && body.transaction.id) {
            transactionId = body.transaction.id;
          }
        }
      }

      Logger.info(`[EASYPAY] Final eventType resolved: ${eventType}`, 'easypay-webhook');

      if (!transactionId || !orderCode || !eventType) {
        Logger.info('[EASYPAY] Faltam transactionId, orderCode ou eventType', 'easypay-webhook');
        return res.status(400).send('Missing transaction ID, order code, or event type');
      }

      // 3) Optional HMAC
      // if (!this.easypaySdkService.verifySignature(body, signature)) {
      //     return res.status(403).send('Invalid signature');
      // }

      // 4) Fetch remote para capture/sale
      let remote: any = body;
      if (eventType === 'capture' || eventType === 'sale') {
        const fetched = await this.easypaySdkService.getTransaction(transactionId, eventType);
        if (!fetched) {
          Logger.info(`[EASYPAY] Transaction ${transactionId} não encontrada`, 'easypay-webhook');
          return res.status(404).send('Transaction not found');
        }
        remote = fetched;
      }

      // 5) Checks payload vs API consistency
      const remoteKey = remote.transaction_key ?? remote.key ?? remote.order?.key ?? null;
      if (
        (eventType !== 'authorisation' && remote.payment_id !== transactionId) ||
        (eventStatus && remote.status !== eventStatus) ||
        (eventType !== 'authorisation' && remoteKey !== orderCode)
      ) {
        Logger.info(
          `[EASYPAY] Payload mismatch:
                        → payment_id: ${remote.payment_id} vs ${transactionId}
                        → status: ${remote.status} vs ${eventStatus}
                        → transaction_key: ${remoteKey} vs ${orderCode}`,
          'easypay-webhook',
        );
        return res.status(400).send('Notification mismatch');
      }

      // 5.1) Normalizes metadata so the handler doesn't return "Error"
      if (eventType === 'authorisation') {
        remote = {
          ...remote,
          status: 'success',
          state: 'Authorized',
          transactionId,
        };
      } else {
        // capture/sale
        remote = {
          ...remote,
          status: 'success',
          state: 'Settled',
          transactionId,
        };
      }

      // 6) Load order with channels, payments and shipping lines
      const order = await this.connection
        .getRepository<Order>('Order')
        .createQueryBuilder('order')
        .where('order.code = :code', { code: orderCode })
        .leftJoinAndSelect('order.channels', 'channel')
        .leftJoinAndSelect('order.payments', 'payments')
        .leftJoinAndSelect('order.shippingLines', 'shippingLine')
        .leftJoinAndSelect('shippingLine.shippingMethod', 'shippingMethod')
        .leftJoinAndSelect('order.lines', 'lines')
        .getOne();

      if (!order) {
        Logger.info(`[EASYPAY] Order "${orderCode}" não encontrada`, 'easypay-webhook');
        return res.status(404).send('Order not found');
      }

      // Detect courier via fulfillment handler code (robust)
      const isCourierShipping =
        order.shippingLines?.some(
          sl => sl.shippingMethod?.fulfillmentHandlerCode === 'courier-fulfillment',
        ) ?? false;
      Logger.info(`[EASYPAY] isCourierShipping? ${String(isCourierShipping)}`, 'easypay-webhook');

      // 6.1) Idempotence: if the PARENT already has this tx → STILL synchronizes sub-orders
      const parentAlreadyHasTx =
        order.payments?.some(p => (p as any).metadata?.transactionId === transactionId) ?? false;

      if (parentAlreadyHasTx) {
        // NOT return yet — synchronize the sub-orders further down (after the parent's upsert).
        Logger.info(
          `[EASYPAY] Parent already has tx=${transactionId} → will sync sub-orders`,
          'easypay-webhook',
        );
      }

      // 7) Create admin context
      const ctx = await this.requestContextService.create({
        apiType: 'admin',
        channelOrToken: order.channels[0].token,
        languageCode: LanguageCode.pt,
      });

      // 8) Payment failure?
      if (eventStatus && eventStatus !== 'success') {
        await this.orderService.transitionToState(ctx, order.id, 'Cancelled');
        return res.status(200).send('Payment failed, order cancelled');
      }

      // 9) Ensure method exists
      const method = await this.connection
        .getRepository<PaymentMethod>('PaymentMethod')
        .findOne({ where: { code: EASYPAY_METHOD_CODE } });
      if (!method) {
        throw new Error('[EASYPAY] PaymentMethod "easypay" não encontrada');
      }

      Logger.info(`[EASYPAY] LOCK order=${order.code} tx=${transactionId}`, 'easypay-webhook');
      // 10) Upsert Payment (idempotent, WITH TRANSACTIONAL LOCK)
      await this.connection.withTransaction(ctx, async txCtx => {
        // 10.a) Pessimistic lock on Order (second instance waits)
        const lockedOrder = await this.connection
          .getRepository(txCtx, Order)
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.payments', 'payments')
          .where('order.id = :id', { id: order.id })
          .setLock('pessimistic_write')
          .getOne();

        if (!lockedOrder) {
          throw new Error('Order not found under lock');
        }

        const intendedState = eventType === 'authorisation' ? 'Authorized' : 'Settled';

        // 10.b) Re-check idempotency ALREADY UNDER LOCK
        const dup = lockedOrder.payments?.find(
          (p: any) =>
            p.transactionId === transactionId || (p as any)?.metadata?.transactionId === transactionId,
        );

        if (dup) {
          await this.connection.getRepository(txCtx, 'Payment' as any).update(
            dup.id as any,
            {
              metadata: {
                ...(dup as any).metadata,
                ...remote,
                transactionId,
                state: intendedState,
              },
            } as any,
          );
          return;
        }

        // 10.c) Create payment under lock
        const addResult = await this.orderService.addPaymentToOrder(txCtx, lockedOrder.id, {
          method: method.code,
          metadata: { ...remote, transactionId, state: intendedState },
        });

        if (!(addResult instanceof Order)) {
          const code = (addResult as any)?.errorCode ?? 'UNKNOWN';
          Logger.warn(`[EASYPAY] addPaymentToOrder (parent) returned ${code}`, 'easypay-webhook');
          // We DO NOT throw — we continue, because below we will synchronize payments/statuses anyway
        }
      });
      Logger.info(`[EASYPAY] UPSERT done order=${order.code} tx=${transactionId}`, 'easypay-webhook');

      // 10.2) NON-COURIER → CAPTURE immediately after AUTHORISATION
      if (!isCourierShipping && eventType === 'authorisation') {
        try {
          // ensure that the order is hydrated for calculations
          const hydratedOrder = await this.orderService.findOne(ctx, order.id, [
            'shippingLines',
            'shippingLines.shippingMethod',
            'shippingLines.shippingMethod.channels',
            'lines',
            'lines.productVariant',
            'lines.productVariant.product',
            'lines.productVariant.product.channels',
            'lines.productVariant.product.channels.customFields',
          ]);

          const splits = await this.buildNonCourierSplits(ctx, hydratedOrder!);
          if (splits.length > 0) {
            Logger.info(
              `[EASYPAY] Non-courier: capturing tx=${transactionId} with ${splits.length} splits`,
              'easypay-webhook',
            );
            await this.easypaySdkService.captureAuthorisationWithSplits(transactionId, order.code, splits);
            Logger.info(`[EASYPAY] Non-courier: capture done`, 'easypay-webhook');
          } else {
            Logger.info(`[EASYPAY] Non-courier: no splits to capture`, 'easypay-webhook');
          }
        } catch (e) {
          Logger.warn(
            `[EASYPAY] Non-courier capture error: ${e instanceof Error ? e.message : e}`,
            'easypay-webhook',
          );
        }
      }

      // 10.1) Synchronize sub-orders (create/update Easypay Payment) — PER-SUB courier decision
      {
        const subOrders = await this.connection.getRepository<Order>('Order').find({
          where: { aggregateOrderId: order.id as any },
          relations: ['channels', 'payments', 'shippingLines', 'shippingLines.shippingMethod'],
        });

        Logger.info(
          `[EASYPAY] Syncing ${subOrders.length} sub-orders for tx=${transactionId}`,
          'easypay-webhook',
        );

        for (const sub of subOrders) {
          const subCtx = await this.requestContextService.create({
            apiType: 'admin',
            channelOrToken: sub.channels[0]?.token,
            languageCode: LanguageCode.pt,
          });

          await this.connection.withTransaction(subCtx, async lockedCtx => {
            // (A) lock
            const lockedSub = await this.connection
              .getRepository(lockedCtx, Order)
              .createQueryBuilder('order')
              .leftJoinAndSelect('order.payments', 'payments')
              .leftJoinAndSelect('order.shippingLines', 'shippingLines')
              .leftJoinAndSelect('shippingLines.shippingMethod', 'shippingMethod')
              .where('order.id = :id', { id: sub.id })
              .setLock('pessimistic_write')
              .getOne();
            if (!lockedSub) throw new Error('Sub-order not found under lock');

            // (A.1) decide courier vs non-courier BY SUB
            const isSubCourier = (lockedSub.shippingLines ?? []).some(
              sl => sl?.shippingMethod?.fulfillmentHandlerCode === 'courier-fulfillment',
            );

            const intendedState = eventType === 'authorisation' ? 'Authorized' : 'Settled';

            // (B) idempotency under lock → update or create
            const existing = lockedSub.payments?.find(
              (p: any) => p.transactionId === transactionId || p?.metadata?.transactionId === transactionId,
            );
            if (existing) {
              await this.connection.getRepository(lockedCtx, 'Payment' as any).update(
                existing.id as any,
                {
                  method: EASYPAY_METHOD_CODE,
                  metadata: {
                    ...(existing as any).metadata,
                    ...remote,
                    transactionId,
                    state: intendedState,
                  },
                } as any,
              );
            } else {
              Logger.info(`[EASYPAY] Adding EASYPAY payment to sub ${lockedSub.code}`, 'easypay-webhook');
              const addRes = await this.orderService.addPaymentToOrder(lockedCtx, lockedSub.id, {
                method: EASYPAY_METHOD_CODE,
                metadata: { ...remote, transactionId, state: intendedState },
              });
              if (!(addRes instanceof Order)) {
                const code = (addRes as any)?.errorCode ?? 'UNKNOWN';
                Logger.warn(
                  `[EASYPAY] addPaymentToOrder (sub ${lockedSub.code}) returned ${code}`,
                  'easypay-webhook',
                );
                // No throw — we then rehydrate and choose the current payment by transactionId
              }
            }

            // (C) refresh & currentPayment
            const refreshed = await this.orderService.findOne(lockedCtx, lockedSub.id, ['payments']);
            const currentPayment = refreshed?.payments?.find(
              p => (p as any)?.metadata?.transactionId === transactionId || p.transactionId === transactionId,
            );

            // (D) clear old Authorized (same tx) if they are left hanging
            for (const p of refreshed?.payments ?? []) {
              const stale =
                p.id !== currentPayment?.id &&
                p.method === EASYPAY_METHOD_CODE &&
                p.state === 'Authorized' &&
                ((p as any)?.metadata?.transactionId === transactionId || p.transactionId === transactionId);

              if (stale) {
                Logger.info(
                  `[EASYPAY] Canceling stale Authorized payment ${p.id} on sub ${lockedSub.code}`,
                  'easypay-webhook',
                );
                await this.orderService.cancelPayment(lockedCtx, p.id).catch(async () => {
                  await this.connection
                    .getRepository(lockedCtx, 'Payment' as any)
                    .update(p.id as any, { state: 'Cancelled' } as any);
                });
              }
            }

            // (E) NON-COURIER FLOW (per-sub) → immediate settlement upon authorization
            if (!isSubCourier && eventType === 'authorisation' && currentPayment?.state === 'Authorized') {
              Logger.info(
                `[EASYPAY] Settling sub payment ${currentPayment.id} (NOT courier) for ${lockedSub.code}`,
                'easypay-webhook',
              );
              await this.orderService.settlePayment(lockedCtx, currentPayment.id);

              // ensure sub order state
              const s = await this.connection
                .getRepository(lockedCtx, Order)
                .findOne({ where: { id: lockedSub.id } });
              if (s && s.state !== 'PaymentSettled') {
                await this.orderService.transitionToState(lockedCtx, s.id, 'PaymentSettled');
              }
            }

            // (F) capture/sale → for non-courier sub we guarantee PaymentSettled
            if (!isSubCourier && (eventType === 'capture' || eventType === 'sale')) {
              const s = await this.connection
                .getRepository(lockedCtx, Order)
                .findOne({ where: { id: lockedSub.id } });
              if (s && s.state !== 'PaymentSettled') {
                await this.orderService.transitionToState(lockedCtx, s.id, 'PaymentSettled');
              }
            }

            // (G) sub courier → do not touch settle here; it remains Authorized until delivery
          });
        }
      }

      // 11) Final state transition (only if necessary)
      const freshOrder = await this.connection
        .getRepository<Order>('Order')
        .findOne({ where: { id: order.id } });

      let desiredState: 'PaymentAuthorized' | 'PaymentSettled' | undefined;
      if (eventType === 'authorisation') {
        desiredState = 'PaymentAuthorized';
      } else if ((eventType === 'capture' || eventType === 'sale') && !isCourierShipping) {
        desiredState = 'PaymentSettled';
      } else {
        desiredState = undefined; // courier → keeps Authorized until delivery
      }

      if (desiredState && freshOrder?.state !== desiredState) {
        Logger.info(`[EASYPAY] Transitioning ${freshOrder?.code} → ${desiredState}`, 'easypay-webhook');
        await this.orderService.transitionToState(ctx, freshOrder!.id, desiredState);
      } else {
        Logger.info(`[EASYPAY] Skipping transition (estado atual: ${freshOrder?.state})`, 'easypay-webhook');
      }

      // 11.1) If it is NOT courier and the event is authorisation → settle the Payment and the Order
      if (!isCourierShipping && eventType === 'authorisation') {
        // gets the payment created in the previous step (upsert)
        const freshWithPayments = await this.orderService.findOne(ctx, order.id, ['payments']);
        const payment = freshWithPayments?.payments?.find(
          p => (p as any)?.metadata?.transactionId === transactionId || p.transactionId === transactionId,
        );

        if (payment) {
          if (payment.state === 'Authorized') {
            Logger.info(`[EASYPAY] Settling payment ${payment.id} (not courier)`, 'easypay-webhook');
            // Our handler will return { success: true }
            await this.orderService.settlePayment(ctx, payment.id);
          }
        } else {
          Logger.info(`[EASYPAY] Payment not found for settle in ${order.code}`, 'easypay-webhook');
        }

        // Ensures Order status
        const latest = await this.connection.getRepository(Order).findOne({ where: { id: order.id } });
        if (latest && latest.state !== 'PaymentSettled') {
          Logger.info(`[EASYPAY] Transitioning ${latest.code} → PaymentSettled`, 'easypay-webhook');
          await this.orderService.transitionToState(ctx, latest.id, 'PaymentSettled');
        }
      }

      return res.status(200).send('Webhook processed successfully');
    } catch (err) {
      Logger.info(
        '[EASYPAY] Webhook error: ' + (err instanceof Error ? err.stack : String(err)),
        'easypay-webhook',
      );
      return res.status(500).send('Webhook handling failed');
    }
  }

  private async buildNonCourierSplits(
    ctx: any,
    order: any,
  ): Promise<
    Array<{ split_key: string; split_descriptive: string; value: number; account: { id: string } }>
  > {
    // 1) Platform Settings
    const settings = await this.globalSettings.getSettings(ctx);
    const cf: any = (settings as any).customFields ?? {};
    const platformAccount = cf.easypayAccountUid as string;
    if (!platformAccount) throw new Error('Missing EasyPay platform account UID');

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

    // helper to know if the seller is a courier
    const getSellerFhCode = (sellerId: string): string | undefined => {
      const sl = (order.shippingLines ?? []).find(
        (s: any) => s?.shippingMethod?.channels?.[0]?.sellerId === sellerId,
      );
      return sl?.shippingMethod?.fulfillmentHandlerCode;
    };

    // 2) Group GROSS by seller only from the NON-courier subset
    const bySeller = new Map<string, { gross: number; accountId: string }>();
    let subsetTotalCents = 0;

    for (const line of order.lines ?? []) {
      const prod: any = line.productVariant.product;
      const chan = prod.channels?.[0];
      if (!chan?.sellerId) continue;
      const sellerId = chan.sellerId as string;
      const fh = getSellerFhCode(sellerId);
      if (fh === 'courier-fulfillment') continue;

      const seller = await this.connection.getRepository(ctx, Seller).findOne({
        where: { id: sellerId as any },
        relations: ['customFields'],
      });
      const accountId = (seller as any)?.customFields?.connectedAccountId;
      if (!accountId) continue;

      const grossLine = Math.round(line.unitPriceWithTax * line.quantity);
      subsetTotalCents += grossLine;

      const entry = bySeller.get(sellerId) ?? { gross: 0, accountId };
      entry.gross += grossLine;
      bySeller.set(sellerId, entry);
    }

    for (const sl of order.shippingLines ?? []) {
      const sm: any = sl.shippingMethod;
      if (!sm) continue;
      const chan: any = sm.channels?.[0];
      const sellerId: string | undefined = chan?.sellerId;
      if (!sellerId) continue;
      const fh = getSellerFhCode(sellerId);
      if (fh === 'courier-fulfillment') continue;
      if (!bySeller.has(sellerId)) continue;

      const slCents = Math.round((sl as any).discountedPriceWithTax ?? (sl as any).priceWithTax ?? 0);
      subsetTotalCents += slCents;
      const entry = bySeller.get(sellerId)!;
      entry.gross += slCents;
      bySeller.set(sellerId, entry);
    }

    if (subsetTotalCents < 2 || bySeller.size === 0) return [];

    // 3) Platform fee calculation (over subset)
    const sellerCount = bySeller.size;
    const percentCents = Math.round(subsetTotalCents * (percentFeeClamped / 100));
    let platformFeeCents = percentCents + fixedFeeCents * sellerCount;
    if (platformFeeCents < 1) platformFeeCents = 1;

    // 4) Proportional distribution by seller
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

    // 5) Drift → platform
    const drift = subsetTotalCents - (sumSellerNet + platformFeeCents);
    const platformValue = +((platformFeeCents + drift) / 100).toFixed(2);

    const platformSplit = {
      split_key: 'split-platform',
      split_descriptive: 'Platform fee',
      value: platformValue,
      account: { id: platformAccount },
    };

    return [...sellerSplits, platformSplit];
  }
}

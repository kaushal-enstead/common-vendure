import {
  EntityHydrator,
  Injector,
  Order,
  OrderInterceptor,
  ProductVariant,
  RequestContext,
  TranslatorService,
  WillAddItemToOrderInput,
  WillAdjustOrderLineInput,
} from '@vendure/core';

/**
 * Enforces ProductVariant.customFields.minQuantity before order changes.
 */
export class MinQuantityOrderInterceptor implements OrderInterceptor {
  private entityHydrator: EntityHydrator;
  private translatorService: TranslatorService;

  init(injector: Injector) {
    this.entityHydrator = injector.get(EntityHydrator);
    this.translatorService = injector.get(TranslatorService);
  }

  async willAddItemToOrder(
    ctx: RequestContext,
    order: Order,
    input: WillAddItemToOrderInput,
  ): Promise<void | string> {
    const { productVariant, quantity } = input;
    const minQuantity = await this.getMinQuantity(ctx, productVariant);

    if (minQuantity && quantity < minQuantity) {
      return this.minErrorMessage(ctx, productVariant, minQuantity);
    }
  }

  async willAdjustOrderLine(
    ctx: RequestContext,
    _order: Order,
    input: WillAdjustOrderLineInput,
  ): Promise<void | string> {
    const { orderLine, quantity } = input;
    const minQuantity = await this.getMinQuantity(ctx, orderLine.productVariant);

    if (minQuantity && quantity < minQuantity) {
      return this.minErrorMessage(ctx, orderLine.productVariant, minQuantity);
    }
  }

  private async getMinQuantity(ctx: RequestContext, variant: ProductVariant): Promise<number | null> {
    await this.entityHydrator.hydrate(ctx, variant, { relations: [] });
    const minQuantityRaw = variant.customFields?.minQuantity;
    return typeof minQuantityRaw === 'number' && Number.isInteger(minQuantityRaw) ? minQuantityRaw : null;
  }

  private async minErrorMessage(ctx: RequestContext, variant: ProductVariant, min: number) {
    const variantName = await this.getTranslatedVariantName(ctx, variant);
    return `Minimum order quantity for "${variantName}" is ${min}`;
  }

  private async maxErrorMessage(ctx: RequestContext, variant: ProductVariant, max: number) {
    const variantName = await this.getTranslatedVariantName(ctx, variant);
    return `Maximum order quantity for "${variantName}" is ${max}`;
  }

  private async getTranslatedVariantName(ctx: RequestContext, variant: ProductVariant): Promise<string> {
    await this.entityHydrator.hydrate(ctx, variant, { relations: ['translations'] });
    const translated = this.translatorService.translate(variant, ctx);
    return translated.name || String(variant.id);
  }
}

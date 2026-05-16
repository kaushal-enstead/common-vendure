import {
  AssetService,
  MimeTypeError,
  Product,
  ProductVariant,
  RequestContext,
  TransactionalConnection,
  UserInputError,
} from '@vendure/core';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  constructor(
    private readonly connection: TransactionalConnection,
    private readonly assetService: AssetService,
  ) {}

  async generateProductQrCode(ctx: RequestContext, productId: string): Promise<boolean> {
    const productRepo = this.connection.getRepository(ctx, Product);
    const product = await productRepo.findOne({
      where: { id: productId as any },
      relations: ['customFields.qrCodeAsset'],
    });

    if (!product) {
      throw new UserInputError(`Product "${productId}" was not found`);
    }

    await this.generateForProduct(ctx, product);
    return true;
  }

  async generateProductAndVariantsQrCodes(ctx: RequestContext, productId: string): Promise<boolean> {
    const productRepo = this.connection.getRepository(ctx, Product);
    const variantRepo = this.connection.getRepository(ctx, ProductVariant);

    const product = await productRepo.findOne({
      where: { id: productId as any },
      relations: ['variants', 'customFields.qrCodeAsset'],
    });

    if (!product) {
      throw new UserInputError(`Product "${productId}" was not found`);
    }

    await this.generateForProduct(ctx, product);

    for (const variantRef of product.variants ?? []) {
      const variant = await variantRepo.findOne({
        where: { id: variantRef.id as any },
        relations: ['customFields.qrCodeAsset'],
      });
      if (!variant) {
        continue;
      }
      await this.generateForVariant(ctx, variant);
    }

    return true;
  }

  private async generateForProduct(ctx: RequestContext, product: Product): Promise<void> {
    const qrPayload = JSON.stringify({ entity: 'product', id: String(product.id) });
    const asset = await this.createQrAsset(
      ctx,
      qrPayload,
      `product-${String(product.id)}-qr-${Date.now()}.png`,
    );

    const customFields = ((product as any).customFields ?? {}) as Record<string, unknown>;
    customFields.qrCodeAsset = asset;
    (product as any).customFields = customFields;
    await this.connection.getRepository(ctx, Product).save(product);
  }

  private async generateForVariant(ctx: RequestContext, variant: ProductVariant): Promise<void> {
    const qrPayload = JSON.stringify({
      entity: 'product-variant',
      id: String(variant.id),
      sku: variant.sku,
    });
    const asset = await this.createQrAsset(
      ctx,
      qrPayload,
      `variant-${String(variant.id)}-qr-${Date.now()}.png`,
    );

    const customFields = ((variant as any).customFields ?? {}) as Record<string, unknown>;
    customFields.qrCodeAsset = asset;
    (variant as any).customFields = customFields;
    await this.connection.getRepository(ctx, ProductVariant).save(variant);
  }

  private async createQrAsset(
    ctx: RequestContext,
    payload: string,
    fileName: string,
  ): Promise<{ id: string }> {
    const pngBuffer = await QRCode.toBuffer(payload, {
      type: 'png',
      width: 640,
      margin: 1,
    });
    const stream = Readable.from(pngBuffer);
    const result = await this.assetService.createFromFileStream(stream, fileName, ctx);

    if (result instanceof MimeTypeError || !(result as any).id) {
      throw new UserInputError('Failed to create QR code asset');
    }

    return { id: (result as any).id };
  }
}

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext } from '@vendure/core';
import { Permission } from '@vendure/common/lib/generated-types';
import { QrCodeService } from '../services/qr-code.service';

@Resolver()
export class QrCodeResolver {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Mutation()
  @Allow(Permission.UpdateCatalog)
  async generateProductQrCode(
    @Ctx() ctx: RequestContext,
    @Args('productId') productId: string,
  ): Promise<boolean> {
    return this.qrCodeService.generateProductQrCode(ctx, productId);
  }

  @Mutation()
  @Allow(Permission.UpdateCatalog)
  async generateProductAndVariantsQrCodes(
    @Ctx() ctx: RequestContext,
    @Args('productId') productId: string,
  ): Promise<boolean> {
    return this.qrCodeService.generateProductAndVariantsQrCodes(ctx, productId);
  }
}

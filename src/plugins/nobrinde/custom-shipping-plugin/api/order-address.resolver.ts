import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, TransactionalConnection, Zone } from '@vendure/core';
import { findZoneForCountry } from '../destination';

type OrderAddressParent = {
  countryCode?: string | null;
  postalCode?: string | null;
};

@Resolver('OrderAddress')
export class OrderAddressZoneResolver {
  constructor(private readonly connection: TransactionalConnection) {}

  @ResolveField()
  async zone(@Ctx() ctx: RequestContext, @Parent() address: OrderAddressParent): Promise<Zone | null> {
    if (!address.countryCode) return null;
    return findZoneForCountry(ctx, address.countryCode, address.postalCode, this.connection);
  }
}

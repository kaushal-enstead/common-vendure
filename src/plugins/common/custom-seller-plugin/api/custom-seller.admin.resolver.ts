import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    ListQueryOptions,
    PaginatedList,
    Permission,
    RequestContext,
    Seller,
} from '@vendure/core';
import { NativeAuthenticationResult } from '../gql/generated';
import { CustomSellerService } from '../services/custom-seller.service';

@Resolver()
export class CustomSellerAdminResolver {
    constructor(private customSellerService: CustomSellerService) {}

    @Mutation(() => Boolean, { name: 'approveSeller' })
    @Allow(Permission.SuperAdmin)
    async approveSeller(@Args('sellerId') sellerId: string, @Ctx() ctx: RequestContext): Promise<boolean> {
        return this.customSellerService.approve(ctx, sellerId);
    }

    @Mutation(() => Boolean, { name: 'rejectSeller' })
    @Allow(Permission.SuperAdmin)
    async rejectSeller(
        @Args('sellerId') sellerId: string,
        @Args('reason') reason: string,
        @Ctx() ctx: RequestContext,
    ): Promise<boolean> {
        return this.customSellerService.reject(ctx, sellerId, reason);
    }

    @Mutation()
    async sellerLogin(
        @Args('ctx') ctx: RequestContext,
        @Args('email') email: string,
        @Args('password') password: string,
    ): Promise<NativeAuthenticationResult> {
        return this.customSellerService.login(ctx, email, password);
    }

    // Overridden Default Vendure Query
    @Query()
    @Allow(Permission.ReadSeller)
    async sellers(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Seller> },
    ): Promise<PaginatedList<Seller>> {
        return this.customSellerService.findSellers(ctx, args.options);
    }
}

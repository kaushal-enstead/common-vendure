import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    RegisterCustomerAccountResult,
    RegisterCustomerInput,
} from '@vendure/common/lib/generated-shop-types';
import { CreateAddressInput } from '@vendure/common/lib/generated-types';

import { Allow, Ctx, Permission, RequestContext, Transaction } from '@vendure/core';
import { CustomCustomerService } from '../services/custom-customer.service';
@Resolver()
export class CustomCustomerShopResolver {
    constructor(private customCustomerService: CustomCustomerService) {}

    @Mutation()
    @Allow(Permission.Authenticated)
    async deleteCustomerAccount(@Ctx() ctx: RequestContext): Promise<boolean> {
        return await this.customCustomerService.delete(ctx);
    }

    @Transaction()
    @Mutation()
    @Allow(Permission.Public)
    async registerCustomerAccountWithAddress(
        @Ctx() ctx: RequestContext,
        @Args()
        args: { input: RegisterCustomerInput; address: CreateAddressInput },
    ): Promise<RegisterCustomerAccountResult> {
        return await this.customCustomerService.register(ctx, args);
    }
}

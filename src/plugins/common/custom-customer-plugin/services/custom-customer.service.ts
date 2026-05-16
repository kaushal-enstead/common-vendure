import { Injectable, Logger } from '@nestjs/common';
import {
    ErrorCode,
    MissingPasswordError,
    RegisterCustomerInput,
} from '@vendure/common/lib/generated-shop-types';
import { CreateAddressInput } from '@vendure/common/lib/generated-types';
import {
    ConfigService,
    Customer,
    CustomerService,
    isGraphQlErrorResult,
    NATIVE_AUTH_STRATEGY_NAME,
    NativeAuthStrategyError,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';
import { IsNull } from 'typeorm';
import { FreeGeoService as ORSService } from '../../shared-plugin/services/free-geo-service';

@Injectable()
export class CustomCustomerService {
    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
        private configService: ConfigService,
        private geoService: ORSService,
    ) {}

    protected requireNativeAuthStrategy() {
        const { shopAuthenticationStrategy } = this.configService.authOptions;
        const nativeAuthStrategyIsConfigured = !!shopAuthenticationStrategy.find(
            strategy => strategy.name === NATIVE_AUTH_STRATEGY_NAME,
        );
        if (!nativeAuthStrategyIsConfigured) {
            const authStrategyNames = shopAuthenticationStrategy.map(s => s.name).join(', ');
            const errorMessage =
                'This GraphQL operation requires that the NativeAuthenticationStrategy be configured for the Shop API.\n' +
                `Currently the following AuthenticationStrategies are enabled: ${authStrategyNames}`;
            Logger.error(errorMessage);
            return new NativeAuthStrategyError();
        }
    }

    async delete(ctx: RequestContext): Promise<boolean> {
        const activeUserId = ctx.activeUserId;
        if (!activeUserId) {
            throw new Error('User not found.');
        }
        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: { deletedAt: IsNull(), user: { id: ctx.activeUserId } },
        });

        if (!customer) {
            throw new Error('Customer not found.');
        }

        await this.customerService.softDelete(ctx, customer.id);
        return true;
    }

    async register(ctx: RequestContext, args: { input: RegisterCustomerInput; address: CreateAddressInput }) {
        const nativeAuthStrategyError = this.requireNativeAuthStrategy();
        if (nativeAuthStrategyError) {
            return nativeAuthStrategyError;
        }
        const result = await this.customerService.registerCustomerAccount(ctx, args.input);
        if (isGraphQlErrorResult(result)) {
            if (result.errorCode === ErrorCode.EMAIL_ADDRESS_CONFLICT_ERROR) {
                return { success: true };
            }
            return result as MissingPasswordError;
        }
        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: { emailAddress: args.input.emailAddress },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Store address coordinates for customer if available
        try {
            const geocodedAddress = await this.geoService.geocodeAddress(args.address);
            args.address.customFields = {
                ...args.address?.customFields,
                latitude: geocodedAddress.lat,
                longitude: geocodedAddress.lon,
            };
        } catch (error: any) {
            Logger.error(`Error geocoding address: ${error.message}`, 'CustomCustomerService');
        }
        await this.customerService.createAddress(ctx, customer.id, args.address);
        return { success: true };
    }
}

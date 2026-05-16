import { ID } from '@vendure/core';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CouponCodeEvent, CustomerService, EventBus } from '@vendure/core';
import { LOYALTY_POINTS_PLUGIN_OPTIONS } from '../constants';
import { LoyaltyService } from '../services/loyalty.service';
import { PluginInitOptions } from '../types';

@Injectable()
export class CouponCodeListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private loyaltyService: LoyaltyService,
        private customerService: CustomerService,
        @Inject(LOYALTY_POINTS_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(CouponCodeEvent).subscribe({
            next: async event => {
                try {
                    const { ctx, couponCode, orderId, type } = event;
                    // skip if coupon code is not the loyalty coupon code
                    if (!ctx.activeUserId || couponCode !== this.options.couponCode) {
                        return;
                    }

                    const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId as ID);
                    if (!customer) {
                        return;
                    }
                    if (type === 'assigned') {
                        Logger.debug('freeze points');
                        // freeze points when coupon code is assigned
                        await this.loyaltyService.freezePoints(ctx, customer.id);
                    } else {
                        Logger.debug('unfreeze points');
                        // unfreeze points when coupon code is removed
                        await this.loyaltyService.unfreezePoints(ctx, customer.id);
                    }
                } catch (err) {
                    Logger.error('LoyaltyOrderListener failed: ' + err);
                }
            },
            error: err => {
                Logger.error('LoyaltyOrderListener subscription failed: ' + err);
            },
        });
    }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus, Logger, OrderLineEvent, OrderPlacedEvent } from '@vendure/core';
import { PreOrderService } from '../services/pre-order.service';

@Injectable()
export class PreOrderListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private preOrderService: PreOrderService,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(OrderPlacedEvent).subscribe({
            next: async event => {
                const { order, ctx } = event;
                for (const line of order?.lines) {
                    if (line.customFields?.preOrderId) {
                        await this.preOrderService.markAsCompleted(ctx, line.customFields.preOrderId);
                    }
                }
            },
            error: err => {
                Logger.error('PreOrderListener OrderPlacedEvent subscription failed: ' + err);
            },
        });

        this.eventBus.ofType(OrderLineEvent).subscribe({
            next: async event => {
                if (event.type === 'deleted' || event.type === 'cancelled') {
                    const { orderLine, ctx } = event;
                    if (orderLine?.customFields?.preOrderId) {
                        await this.preOrderService.delete(ctx, orderLine.customFields.preOrderId);
                    }
                }
            },
            error: err => {
                Logger.error('PreOrderListener OrderLineEvent subscription failed: ' + err);
            },
        });
    }
}

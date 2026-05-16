import { Order, RequestContext, VendureEvent } from '@vendure/core';

/**
 * @description
 * This event is fired whenever a Order is split into multiple seller orders.
 */
export class OrderSplitEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public order: Order,
        public sellerOrders: Order[],
    ) {
        super();
    }
}

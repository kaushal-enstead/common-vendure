import { RequestContext, VendureEvent } from '@vendure/core';

/**
 * Fired when an admin sets a shipping quote for an out-of-Europe order
 * and chooses to notify the customer.
 */
export class CustomShippingQuoteReadyEvent extends VendureEvent {
    constructor(
        public readonly ctx: RequestContext,
        public readonly email: string,
        public readonly orderCode: string,
        public readonly shippingAmountWithTax: number,
        public readonly currencyCode: string,
    ) {
        super();
    }
}

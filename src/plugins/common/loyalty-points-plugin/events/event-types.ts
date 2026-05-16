import { RequestContext, VendureEvent } from '@vendure/core';

export class LoyaltyPointsEarnEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public email: string,
        public points: number,
        public balance: number,
        public orderId: string,
    ) {
        super();
    }
}

export class LoyaltyPointsRedeemEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public email: string,
        public points: number,
        public balance: number,
        public orderId: string,
    ) {
        super();
    }
}

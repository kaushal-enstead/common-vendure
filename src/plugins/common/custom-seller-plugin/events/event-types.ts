import { RequestContext, VendureEvent, ID } from '@vendure/core';

export class SellerRejectionEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public sellerId: ID,
        public name: string,
        public email: string,
        public reason: string,
    ) {
        super();
    }
}

export class SellerApprovalEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public sellerId: ID,
        public name: string,
        public email: string,
    ) {
        super();
    }
}

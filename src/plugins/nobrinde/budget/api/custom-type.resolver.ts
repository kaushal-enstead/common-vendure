import { ResolveField, Resolver } from '@nestjs/graphql';

const errorCodeToTypeName: Record<string, string> = {
  ORDER_MODIFICATION_ERROR: 'OrderModificationError',
  ORDER_LIMIT_ERROR: 'OrderLimitError',
  NEGATIVE_QUANTITY_ERROR: 'NegativeQuantityError',
  INSUFFICIENT_STOCK_ERROR: 'InsufficientStockError',
  ORDER_INTERCEPTOR_ERROR: 'OrderInterceptorError',
  INELIGIBLE_SHIPPING_METHOD_ERROR: 'IneligibleShippingMethodError',
  NO_ACTIVE_ORDER_ERROR: 'NoActiveOrderError',
  EMAIL_ADDRESS_CONFLICT_ERROR: 'EmailAddressConflictError',
  COUPON_CODE_EXPIRED_ERROR: 'CouponCodeExpiredError',
  COUPON_CODE_INVALID_ERROR: 'CouponCodeInvalidError',
  COUPON_CODE_LIMIT_ERROR: 'CouponCodeLimitError',
};

function resolveBudgetResultType(value: any, fallbackType: string): string {
  if (value?.id != null) {
    return 'Budget';
  }
  if (typeof value?.__typename === 'string') {
    return value.__typename;
  }
  if (typeof value?.errorCode === 'string') {
    return errorCodeToTypeName[value.errorCode] ?? fallbackType;
  }
  return fallbackType;
}

@Resolver('UpdateBudgetItemsResult')
export class UpdateBudgetItemsResultResolver {
  @ResolveField()
  __resolveType(value: any): string {
    return resolveBudgetResultType(value, 'OrderModificationError');
  }
}

@Resolver('RemoveBudgetItemsResult')
export class RemoveBudgetItemsResultResolver {
  @ResolveField()
  __resolveType(value: any): string {
    return resolveBudgetResultType(value, 'OrderModificationError');
  }
}

@Resolver('SetBudgetShippingMethodResult')
export class SetBudgetShippingMethodResultResolver {
  @ResolveField()
  __resolveType(value: any): string {
    return resolveBudgetResultType(value, 'OrderModificationError');
  }
}

@Resolver('SetCustomerForBudgetOrderResult')
export class SetCustomerForBudgetOrderResultResolver {
  @ResolveField()
  __resolveType(value: any): string {
    return resolveBudgetResultType(value, 'EmailAddressConflictError');
  }
}

@Resolver('ApplyCouponCodeToBudgetOrderResult')
export class ApplyCouponCodeToBudgetOrderResultResolver {
  @ResolveField()
  __resolveType(value: any): string {
    return resolveBudgetResultType(value, 'CouponCodeInvalidError');
  }
}

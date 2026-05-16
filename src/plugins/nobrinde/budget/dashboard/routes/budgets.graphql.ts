import { assetFragment, errorResultFragment } from '@vendure/dashboard';
import { graphql } from '@/gql';

export const budgetListDocument = graphql(`
  query GetBudgets($options: BudgetListOptions) {
    budgets(options: $options) {
      items {
        id
        createdAt
        updatedAt
        type
        code
        state
        customer {
          id
          firstName
          lastName
        }
        orderPlacedAt
        total
        totalWithTax
        currencyCode
        # shippingLines {
        #   shippingMethod {
        #     name
        #   }
        # }
      }
      totalItems
    }
  }
`);

export const discountFragment = graphql(`
  fragment Discount on Discount {
    adjustmentSource
    amount
    amountWithTax
    description
    type
  }
`);

export const orderAddressFragment = graphql(`
  fragment OrderAddress on OrderAddress {
    fullName
    company
    streetLine1
    streetLine2
    city
    province
    postalCode
    country
    countryCode
    phoneNumber
  }
`);

export const budgetLineFragment = graphql(
  `
    fragment BudgetLine on BudgetLine {
      id
      createdAt
      updatedAt
      featuredAsset {
        ...Asset
      }
      productVariant {
        id
        name
        sku
        trackInventory
        stockOnHand
      }
      discounts {
        ...Discount
      }
      unitPrice
      unitPriceWithTax
      proratedUnitPrice
      proratedUnitPriceWithTax
      quantity
      orderPlacedQuantity
      linePrice
      lineTax
      linePriceWithTax
      discountedLinePrice
      discountedLinePriceWithTax
    }
  `,
  [assetFragment],
);

export const budgetDetailFragment = graphql(
  `
    fragment BudgetDetail on Budget {
      id
      createdAt
      updatedAt
      type
      messages {
        id
        content
        sender
        senderId
        timestamp
        budgetId
      }
      aggregateOrder {
        id
        code
      }
      sellerOrders {
        id
        code
        channels {
          id
          code
        }
      }
      channels {
        id
        code
        seller {
          name
        }
      }
      code
      state
      active
      couponCodes
      customer {
        id
        firstName
        lastName
      }
      lines {
        ...BudgetLine
      }
      discounts {
        ...Discount
      }
      promotions {
        id
        couponCode
        name
      }
      subTotal
      subTotalWithTax
      total
      totalWithTax
      currencyCode
      shipping
      shippingWithTax
      taxSummary {
        description
        taxBase
        taxRate
        taxTotal
      }
      shippingAddress {
        ...OrderAddress
      }
      billingAddress {
        ...OrderAddress
      }
    }
  `,
  [discountFragment, orderAddressFragment, budgetLineFragment],
);

export const budgetDetailDocument = graphql(
  `
    query GetBudget($id: ID!) {
      budget(id: $id) {
        ...BudgetDetail
      }
    }
  `,
  [budgetDetailFragment],
);

export const createBudgetOrderDocument = graphql(`
  mutation CreateBudgetOrder {
    createBudgetOrder {
      id
    }
  }
`);

export const deleteBudgetOrderDocument = graphql(`
  mutation DeleteBudgetOrder($budgetId: ID!) {
    deleteBudgetOrder(budgetId: $budgetId) {
      result
      message
    }
  }
`);

export const addItemToBudgetOrderDocument = graphql(
  `
    mutation AddItemToBudgetOrder($budgetId: ID!, $input: AddItemToDraftOrderInput!) {
      addItemToBudgetOrder(budgetId: $budgetId, input: $input) {
        __typename
        ... on Budget {
          id
        }
        ...ErrorResult
      }
    }
  `,
  [errorResultFragment],
);

export const adjustBudgetOrderLineDocument = graphql(
  `
    mutation AdjustBudgetOrderLine($budgetId: ID!, $input: AdjustDraftOrderLineInput!) {
      adjustBudgetOrderLine(budgetId: $budgetId, input: $input) {
        __typename
        ... on Budget {
          id
        }
        ...ErrorResult
      }
    }
  `,
  [errorResultFragment],
);

export const removeBudgetOrderLineDocument = graphql(
  `
    mutation RemoveBudgetOrderLine($budgetId: ID!, $budgetLineId: ID!) {
      removeBudgetOrderLine(budgetId: $budgetId, budgetLineId: $budgetLineId) {
        __typename
        ... on Budget {
          id
        }
        ...ErrorResult
      }
    }
  `,
  [errorResultFragment],
);

export const setCustomerForBudgetOrderDocument = graphql(
  `
    mutation SetCustomerForBudgetOrder($budgetId: ID!, $customerId: ID, $input: CreateCustomerInput) {
      setCustomerForBudgetOrder(budgetId: $budgetId, customerId: $customerId, input: $input) {
        __typename
        ... on Budget {
          id
        }
        ...ErrorResult
      }
    }
  `,
  [errorResultFragment],
);

export const setShippingAddressForBudgetOrderDocument = graphql(`
  mutation SetBudgetOrderShippingAddress($budgetId: ID!, $input: CreateAddressInput!) {
    setBudgetOrderShippingAddress(budgetId: $budgetId, input: $input) {
      id
    }
  }
`);

export const setBillingAddressForBudgetOrderDocument = graphql(`
  mutation SetBudgetOrderBillingAddress($budgetId: ID!, $input: CreateAddressInput!) {
    setBudgetOrderBillingAddress(budgetId: $budgetId, input: $input) {
      id
    }
  }
`);

export const unsetShippingAddressForBudgetOrderDocument = graphql(`
  mutation UnsetBudgetOrderShippingAddress($budgetId: ID!) {
    unsetBudgetOrderShippingAddress(budgetId: $budgetId) {
      id
    }
  }
`);

export const unsetBillingAddressForBudgetOrderDocument = graphql(`
  mutation UnsetBudgetOrderBillingAddress($budgetId: ID!) {
    unsetBudgetOrderBillingAddress(budgetId: $budgetId) {
      id
    }
  }
`);

export const applyCouponCodeToBudgetOrderDocument = graphql(
  `
    mutation ApplyCouponCodeToBudgetOrder($budgetId: ID!, $couponCode: String!) {
      applyCouponCodeToBudgetOrder(budgetId: $budgetId, couponCode: $couponCode) {
        __typename
        ... on Budget {
          id
        }
        ...ErrorResult
      }
    }
  `,
  [errorResultFragment],
);

export const removeCouponCodeFromBudgetOrderDocument = graphql(`
  mutation RemoveCouponCodeFromBudgetOrder($budgetId: ID!, $couponCode: String!) {
    removeCouponCodeFromBudgetOrder(budgetId: $budgetId, couponCode: $couponCode) {
      id
    }
  }
`);

export const couponCodeSelectorPromotionListDocument = graphql(`
  query CouponCodeSelectorPromotionList($options: PromotionListOptions) {
    promotions(options: $options) {
      items {
        id
        name
        couponCode
      }
      totalItems
    }
  }
`);

export const modifyBudgetDocument = graphql(`
  mutation ModifyBudget($budgetId: ID!, $input: ModifyBudgetInput!) {
    modifyBudget(budgetId: $budgetId, input: $input) {
      id
    }
  }
`);

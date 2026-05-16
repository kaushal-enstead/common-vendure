import { gql } from 'graphql-tag';

const budget = gql`
  type BudgetMessage {
    id: String!
    content: String!
    sender: String! # CUSTOMER, SELLER
    senderId: String!
    timestamp: DateTime!
    budgetId: String!
  }

  type BudgetLine implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    productVariant: ProductVariant!
    featuredAsset: Asset
    "The price of a single unit, excluding tax and discounts"
    unitPrice: Money!
    "The price of a single unit, including tax but excluding discounts"
    unitPriceWithTax: Money!
    """
    Non-zero if the unitPrice has changed since it was initially added to Order
    """
    unitPriceChangeSinceAdded: Money!
    """
    Non-zero if the unitPriceWithTax has changed since it was initially added to Order
    """
    unitPriceWithTaxChangeSinceAdded: Money!
    """
    The price of a single unit including discounts, excluding tax.

    If Order-level discounts have been applied, this will not be the
    actual taxable unit price (see \`proratedUnitPrice\`), but is generally the
    correct price to display to customers to avoid confusion
    about the internal handling of distributed Order-level discounts.
    """
    discountedUnitPrice: Money!
    "The price of a single unit including discounts and tax"
    discountedUnitPriceWithTax: Money!
    """
    The actual unit price, taking into account both item discounts _and_ prorated (proportionally-distributed)
    Order-level discounts. This value is the true economic value of the OrderItem, and is used in tax
    and refund calculations.
    """
    proratedUnitPrice: Money!
    "The proratedUnitPrice including tax"
    proratedUnitPriceWithTax: Money!
    "The quantity of items purchased"
    quantity: Int!
    "The quantity at the time the Order was placed"
    orderPlacedQuantity: Int!
    taxRate: Float!
    """
    The total price of the line excluding tax and discounts.
    """
    linePrice: Money!
    """
    The total price of the line including tax but excluding discounts.
    """
    linePriceWithTax: Money!
    "The price of the line including discounts, excluding tax"
    discountedLinePrice: Money!
    "The price of the line including discounts and tax"
    discountedLinePriceWithTax: Money!
    """
    The actual line price, taking into account both item discounts _and_ prorated (proportionally-distributed)
    Order-level discounts. This value is the true economic value of the OrderLine, and is used in tax
    and refund calculations.
    """
    proratedLinePrice: Money!
    "The proratedLinePrice including tax"
    proratedLinePriceWithTax: Money!
    "The total tax on this line"
    lineTax: Money!
    discounts: [Discount!]!
    taxLines: [TaxLine!]!
    budget: Budget!
  }

  enum BudgetType {
    Admin
    Customer
  }

  type Budget implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    type: BudgetType!
    messages: [BudgetMessage!]
    """
    The date & time that the Order was placed, i.e. the Customer
    completed the checkout and the Order is no longer "active"
    """
    orderPlacedAt: DateTime
    "A unique code for the Order"
    code: String!
    state: String! # Pending, Approved, Rejected, ChangesRequested
    "An order is active as long as the payment process has not been completed"
    active: Boolean!
    customer: Customer
    shippingAddress: OrderAddress
    billingAddress: OrderAddress
    lines: [BudgetLine!]!
    """
    Surcharges are arbitrary modifications to the Order total which are neither
    ProductVariants nor discounts resulting from applied Promotions. For example,
    one-off discounts based on customer interaction, or surcharges based on payment
    methods.
    """
    discounts: [Discount!]!
    "An array of all coupon codes applied to the Order"
    couponCodes: [String!]!
    "Promotions applied to the order. Only gets populated after the payment process has completed."
    promotions: [Promotion!]!
    totalQuantity: Int!
    """
    The subTotal is the total of all OrderLines in the Order. This figure also includes any Order-level
    discounts which have been prorated (proportionally distributed) amongst the items of each OrderLine.
    To get a total of all OrderLines which does not account for prorated discounts, use the
    sum of \`OrderLine.discountedLinePrice\` values.
    """
    subTotal: Money!
    "Same as subTotal, but inclusive of tax"
    subTotalWithTax: Money!
    currencyCode: CurrencyCode!
    shippingLines: [ShippingLine!]!
    shipping: Money!
    shippingWithTax: Money!
    """
    Equal to subTotal plus shipping
    """
    total: Money!
    """
    The final payable amount. Equal to subTotalWithTax plus shippingWithTax
    """
    totalWithTax: Money!
    """
    A summary of the taxes being applied to this Order
    """
    taxSummary: [OrderTaxSummary!]!

    """
    The channels through which the Order can be purchased.
    """
    channels: [Channel!]!
    sellerOrders: [Budget!]
    aggregateOrder: Budget
  }
`;

const budgetInputTypes = gql`
  input BudgetFilterParameter {
    customerLastName: StringOperators
    transactionId: StringOperators
  }

  input BudgetSortParameter {
    customerLastName: SortOrder
    transactionId: SortOrder
  }

  input ModifyBudgetInput {
    state: String!
  }

  union UpdateBudgetItemsResult =
    | Budget
    | OrderModificationError
    | OrderLimitError
    | NegativeQuantityError
    | InsufficientStockError
    | OrderInterceptorError

  union RemoveBudgetItemsResult = Budget | OrderModificationError | OrderInterceptorError

  union SetBudgetShippingMethodResult =
    | Budget
    | OrderModificationError
    | IneligibleShippingMethodError
    | NoActiveOrderError

  union SetCustomerForBudgetOrderResult = Budget | EmailAddressConflictError
  union ApplyCouponCodeToBudgetOrderResult =
    | Budget
    | CouponCodeExpiredError
    | CouponCodeInvalidError
    | CouponCodeLimitError

  # generated by generateListOptions function
  input BudgetListOptions
`;

const adminApiExtensions = gql`
  ${budget}
  ${budgetInputTypes}

  type BudgetList implements PaginatedList {
    items: [Budget!]!
    totalItems: Int!
  }

  extend type Query {
    budget(id: ID!): Budget
    budgets(options: BudgetListOptions): BudgetList!
    "Returns a list of eligible shipping methods for the draft Budget"
    eligibleShippingMethodsForBudgetOrder(budgetId: ID!): [ShippingMethodQuote!]!
    getBudgetMessages(budgetId: ID!): [BudgetMessage!]!
  }

  extend type Mutation {
    addBudgetMessage(budgetId: ID!, content: String!): BudgetMessage!
    modifyBudget(budgetId: ID!, input: ModifyBudgetInput!): Budget!
    """
    Allows a different Customer to be assigned to a Budget.
    """
    setBudgetCustomer(input: SetOrderCustomerInput!): Budget
    "Creates a budget Order"
    createBudgetOrder: Budget!
    "Deletes a budget Order"
    deleteBudgetOrder(budgetId: ID!): DeletionResponse!
    "Adds an item to the budget Order."
    addItemToBudgetOrder(budgetId: ID!, input: AddItemToDraftOrderInput!): UpdateBudgetItemsResult!
    "Adjusts a budget OrderLine. If custom fields are defined on the budget OrderLine entity, a third argument 'customFields' of type \`OrderLineCustomFieldsInput\` will be available."
    adjustBudgetOrderLine(budgetId: ID!, input: AdjustDraftOrderLineInput!): UpdateBudgetItemsResult!
    "Remove an budget OrderLine from the draft Budget"
    removeBudgetOrderLine(budgetId: ID!, budgetLineId: ID!): RemoveBudgetItemsResult!
    setCustomerForBudgetOrder(
      budgetId: ID!
      customerId: ID
      input: CreateCustomerInput
    ): SetCustomerForBudgetOrderResult!
    "Sets the shipping address for a budget Order"
    setBudgetOrderShippingAddress(budgetId: ID!, input: CreateAddressInput!): Budget!
    "Sets the billing address for a budget Order"
    setBudgetOrderBillingAddress(budgetId: ID!, input: CreateAddressInput!): Budget!
    "Unsets the shipping address for a budget Order"
    unsetBudgetOrderShippingAddress(budgetId: ID!): Budget!
    "Unsets the billing address for a budget Order"
    unsetBudgetOrderBillingAddress(budgetId: ID!): Budget!
    "Applies the given coupon code to the budget Order"
    applyCouponCodeToBudgetOrder(budgetId: ID!, couponCode: String!): ApplyCouponCodeToBudgetOrderResult!
    "Removes the given coupon code from the budget Order"
    removeCouponCodeFromBudgetOrder(budgetId: ID!, couponCode: String!): Budget
    "Sets the shipping method by id, which can be obtained with the \`eligibleShippingMethodsForBudgetOrder\` query"
    setBudgetOrderShippingMethod(budgetId: ID!, shippingMethodId: ID!): SetBudgetShippingMethodResult!
  }
`;

export { adminApiExtensions };

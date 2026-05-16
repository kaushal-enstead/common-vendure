# Budget Plugin

## 📝 Introduction

A comprehensive budget management system for Vendure e-commerce platform that enables administrators to create, manage, and track budgets for customers. This plugin provides a complete budget system with state management, message threading, tax calculations, promotions support, and seamless integration with Vendure's admin dashboard.

---

## ✨ Features

- **Budget Management**: Create, track, and manage budgets with state tracking (PENDING, ACCEPTED, REJECTED, CHANGES_REQUESTED)
- **Budget Types**: Support for ADMIN and CUSTOMER budget types
- **Budget Lines**: Add product variants with quantities, pricing, and tax calculations
- **Message Threading**: Full conversation history with messages from both customers and sellers
- **Price Calculations**: Automatic calculation of subtotals, taxes, shipping, and totals
- **Promotions Support**: Apply coupon codes and promotions to budgets
- **Channel Awareness**: Budgets are channel-aware for multi-channel setups
- **Address Management**: Support for shipping and billing addresses
- **Admin Dashboard Integration**: Modern UI built with Vendure's dashboard extension system
- **Role-based Permissions**: CRUD permissions for budget management
- **Aggregate Orders**: Support for seller orders and aggregate order relationships

---

## 🗄️ Data Models

The plugin introduces two main entities:

### Budget
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  type: BudgetType! // ADMIN, CUSTOMER
  code: String!
  state: BudgetState! // PENDING, ACCEPTED, REJECTED, CHANGES_REQUESTED
  active: Boolean!
  orderPlacedAt: DateTime
  customer: Customer
  customerId: String
  lines: [BudgetLine!]!
  messages: [BudgetMessage!]
  shippingAddress: OrderAddress
  billingAddress: OrderAddress
  currencyCode: CurrencyCode!
  subTotal: Money!
  subTotalWithTax: Money!
  shipping: Money!
  shippingWithTax: Money!
  total: Money!
  totalWithTax: Money!
  totalQuantity: Int!
  couponCodes: [String!]!
  promotions: [Promotion!]!
  discounts: [Discount!]!
  taxSummary: [OrderTaxSummary!]!
  channels: [Channel!]!
  sellerOrders: [Budget!]
  aggregateOrder: Budget
  aggregateOrderId: String
}
```

### BudgetLine
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  productVariant: ProductVariant!
  quantity: Int!
  orderPlacedQuantity: Int!
  unitPrice: Money!
  unitPriceWithTax: Money!
  discountedUnitPrice: Money!
  discountedUnitPriceWithTax: Money!
  proratedUnitPrice: Money!
  proratedUnitPriceWithTax: Money!
  linePrice: Money!
  linePriceWithTax: Money!
  discountedLinePrice: Money!
  discountedLinePriceWithTax: Money!
  proratedLinePrice: Money!
  proratedLinePriceWithTax: Money!
  taxRate: Float!
  discounts: [Discount!]!
  taxLines: [TaxLine!]!
  budget: Budget!
  sellerChannel: Channel
  featuredAsset: Asset
}
```

### BudgetMessage
```typescript
{
  id: String!
  content: String!
  sender: String! // CUSTOMER, SELLER
  senderId: String!
  timestamp: DateTime!
  budgetId: String!
}
```

---

## 🔒 Permissions

The plugin registers the following permissions:

| Permission Code | Description | Scope (Admin/Shop) |
| --------------- | ----------- | ------------------ |
| `Budget.Read` | Can read budgets | Admin |
| `Budget.Create` | Can create budgets | Admin |
| `Budget.Update` | Can update budgets | Admin |
| `Budget.Delete` | Can delete budgets | Admin |

---

## 🗃️ Database Schema

The plugin creates the following database tables:

### budget
- Primary table for storing budgets
- Links to Customer, Channel, and Promotion entities
- Stores budget metadata (state, type, code, addresses, totals)
- Supports aggregate order relationships

### budget_line
- Line items within a budget
- Links to ProductVariant, Budget, Channel, TaxCategory, and Asset entities
- Stores quantity, pricing, tax, and discount information

### budget_promotions_promotion
- Junction table linking budgets to promotions
- Enables many-to-many relationship between budgets and promotions

### budget_channels_channel
- Junction table linking budgets to channels
- Enables many-to-many relationship for channel-aware budgets

---

## 📊 Dashboard Integrations

The plugin provides a custom dashboard extension with:

- **Budgets Section**: Located under the "Budget" section in the admin navigation
- **Budget List View**: Comprehensive list of all budgets with filtering by state and type
- **Budget Detail View**: Detailed budget management page with line items, messages, addresses, and totals
- **Budget Creation**: Quick creation of new budget orders from the dashboard
- **State Management**: Visual state indicators with color-coded badges
- **Message Threading**: Inline message interface for budget communication

---

## Installation

1. **Add the plugin to your Vendure configuration**:

```typescript
import { BudgetPlugin } from './plugins/budget/budget.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    BudgetPlugin.init({
      // Plugin options (currently none required)
    }),
    // ... other plugins
  ],
};
```

2. **Run database migrations**:
   - The plugin includes a migration that creates the necessary database tables
   - Run migrations using your standard Vendure migration process

---

## 🏗️ Project Structure

```
src/plugins/budget/
├── api/                    # GraphQL resolvers and schema extensions
│   ├── api-extensions.ts   # GraphQL schema definitions
│   ├── budget.resolver.ts
│   ├── budget-entity.resolver.ts
│   ├── budget-line.resolver.ts
│   └── custom-type.resolver.ts
├── dashboard/              # Admin UI components
│   ├── index.tsx          # Dashboard extension definition
│   └── routes/            # Dashboard routes and components
│       ├── budgets.tsx
│       ├── budgets_$id.tsx
│       ├── budgets.graphql.ts
│       └── components/    # Reusable dashboard components
├── entity/                # TypeORM entities
│   ├── budget.entity.ts
│   └── budget-line.entity.ts
├── services/              # Business logic services
│   ├── budget.service.ts
│   └── budget-modifier.ts
├── utils/                 # Utility functions
│   └── tax-utils.ts
├── gql/                   # Generated GraphQL types
├── constants.ts           # Plugin constants and permissions
├── types.ts              # TypeScript type definitions
└── budget.plugin.ts       # Main plugin definition
```

---

## GraphQL API

The plugin provides comprehensive GraphQL APIs for the Admin context:

### Admin API

**Queries:**
- `budget(id: ID!)`: Get a single budget by ID
- `budgets(options: BudgetListOptions)`: Get a paginated list of budgets
- `eligibleShippingMethodsForBudgetOrder(budgetId: ID!)`: Get eligible shipping methods
- `getBudgetMessages(budgetId: ID!)`: Get all messages for a budget

**Mutations:**
- `createBudgetOrder`: Create a new budget order
- `deleteBudgetOrder(budgetId: ID!)`: Delete a budget order
- `modifyBudget(budgetId: ID!, input: ModifyBudgetInput!)`: Update budget state
- `addItemToBudgetOrder(budgetId: ID!, input: AddItemToDraftOrderInput!)`: Add item to budget
- `adjustBudgetOrderLine(budgetId: ID!, input: AdjustDraftOrderLineInput!)`: Adjust budget line
- `removeBudgetOrderLine(budgetId: ID!, budgetLineId: ID!)`: Remove line from budget
- `setCustomerForBudgetOrder(budgetId: ID!, customerId: ID, input: CreateCustomerInput)`: Set customer
- `setBudgetOrderShippingAddress(budgetId: ID!, input: CreateAddressInput!)`: Set shipping address
- `setBudgetOrderBillingAddress(budgetId: ID!, input: CreateAddressInput!)`: Set billing address
- `unsetBudgetOrderShippingAddress(budgetId: ID!)`: Remove shipping address
- `unsetBudgetOrderBillingAddress(budgetId: ID!)`: Remove billing address
- `applyCouponCodeToBudgetOrder(budgetId: ID!, couponCode: String!)`: Apply coupon code
- `removeCouponCodeFromBudgetOrder(budgetId: ID!, couponCode: String!)`: Remove coupon code
- `setBudgetOrderShippingMethod(budgetId: ID!, shippingMethodId: ID!)`: Set shipping method
- `addBudgetMessage(budgetId: ID!, content: String!)`: Add message to budget

---

## 💡 Usage Examples

### Creating a Budget

```typescript
// Via GraphQL mutation
mutation {
  createBudgetOrder {
    id
    code
    state
    type
  }
}
```

### Adding Items to a Budget

```typescript
mutation {
  addItemToBudgetOrder(
    budgetId: "1"
    input: {
      productVariantId: "2"
      quantity: 5
    }
  ) {
    ... on Budget {
      id
      lines {
        id
        quantity
        productVariant {
          name
        }
      }
    }
  }
}
```

### Modifying Budget State

```typescript
mutation {
  modifyBudget(
    budgetId: "1"
    input: {
      state: "Accepted"
    }
  ) {
    id
    state
  }
}
```

### Adding Messages

```typescript
mutation {
  addBudgetMessage(
    budgetId: "1"
    content: "Please review the budget and let me know if any changes are needed."
  ) {
    id
    content
    sender
    timestamp
  }
}
```

---

## 🔄 Budget States

The plugin supports the following budget states:

- **PENDING**: Budget is awaiting review or approval
- **ACCEPTED**: Budget has been accepted
- **REJECTED**: Budget has been rejected
- **CHANGES_REQUESTED**: Budget requires modifications before approval

---

## 📝 Notes

- Budgets are channel-aware and must be associated with at least one channel
- Budget lines support full tax calculations and discount applications
- The plugin integrates with Vendure's promotion system for coupon code support
- Budget messages support both customer and seller (admin) senders
- Aggregate orders allow linking seller-specific budgets to a main aggregate budget


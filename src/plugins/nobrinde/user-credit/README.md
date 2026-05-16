# User Credit Payment Method Plugin

This plugin adds a custom payment method called "user-credit" to Vendure that allows customers to pay using their account credits.

## Features

1. **Payment Method**: `user-credit` - A payment method that uses customer credits
2. **Minimum Order Value**: Configurable minimum order value required to use this payment method
3. **Credit Validation**: Checks if customer has sufficient available credits (credits - credits_used >= order total)
4. **Custom Fields**: Adds `credits` and `credits_used` custom fields to Customer entity in a separate "User Credits" tab
5. **Payment State**: Payments are automatically set to "Authorized" state when created, requiring manual settlement by admin
6. **Transaction ID**: Supports transactionId input when adding payments
7. **Automatic Credit Deduction**: Automatically updates `credits_used` when payment is settled

## Setup

1. The plugin is already registered in `vendure-config.ts`
2. Create a payment method in the admin UI:
   - Go to Settings > Payment Methods
   - Create a new payment method
   - Set code to: `user-credit`
   - Select the "user-credit" handler
   - Configure the minimum order value (in cents, e.g., 10000 for $100.00)
   - Save

## Usage

### For Customers

1. Customers must have credits in their account (set via Customer custom fields)
2. When placing an order, if the order value meets the minimum requirement and the customer has sufficient credits, the "user-credit" payment method will be available
3. Upon payment, the order moves to "Payment Authorized" state

### For Admins

1. View customer credits in the Customer detail page under the "User Credits" tab
2. When adding a payment manually:
   - Select the "user-credit" payment method
   - Enter the transaction ID (optional but recommended)
   - The payment will be created in "Authorized" state
3. To settle the payment:
   - Navigate to the order
   - Manually transition the payment to "Settled" state
   - The `credits_used` field will be automatically updated

## Custom Fields

- **credits** (int): Total credits available to the customer
- **credits_used** (int): Total credits used by the customer (automatically updated when payments are settled)

Both fields are displayed in a separate "User Credits" tab in the Customer detail page.

## Payment Flow

1. Customer selects "user-credit" payment method
2. System validates:
   - Order value >= minimum order value
   - Available credits (credits - credits_used) >= order total
3. If valid, payment is created in "Authorized" state
4. Admin manually settles the payment
5. Upon settlement, `credits_used` is automatically incremented by the payment amount

## Technical Details

- **Handler Code**: `user-credit`
- **Checker Code**: `user-credit-checker`
- **Payment States**: Authorized → Settled (manual)
- **Transaction ID**: Stored in payment metadata


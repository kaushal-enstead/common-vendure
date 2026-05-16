# Wire Transfer Payment Plugin

A Vendure plugin that adds a wire transfer payment method with minimum order value validation and transaction ID tracking.

## Features

- **Minimum Order Value**: Configure a minimum order value required to use this payment method
- **Transaction ID Input**: Requires a transaction ID to be provided during payment
- **Payment Authorization**: Payments are automatically set to "Authorized" state when created
- **Manual Settlement**: Admin can manually settle payments from "Authorized" to "Settled" state
- **Payment Method Checker**: Validates minimum order value before payment method is available

## Setup

The plugin is already registered in `vendure-config.ts`. No additional setup is required.

## Configuration

1. Navigate to **Settings** > **Payment Methods** in the Admin UI
2. Click **Add Payment Method**
3. Select **Wire Transfer** as the handler
4. Configure the **Minimum Order Value** (in the smallest currency unit, e.g., cents)
5. Optionally, select the **Wire Transfer Checker** as the checker
6. Save the payment method

## Usage

### Storefront Integration

When a customer selects the wire transfer payment method, your storefront should:

1. Display an input field for the transaction ID
2. When submitting the payment, include the transaction ID in the metadata:

```graphql
mutation AddPaymentToOrder($input: PaymentInput!) {
  addPaymentToOrder(input: $input) {
    ... on Order {
      id
      state
      payments {
        id
        state
        transactionId
        metadata
      }
    }
    ... on ErrorResult {
      errorCode
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "method": "wire-transfer",
    "metadata": {
      "transactionId": "TXN-123456789"
    }
  }
}
```

### Admin Workflow

1. Customer completes wire transfer and provides transaction ID
2. Payment is created with state "Authorized"
3. Admin verifies the payment in the bank
4. Admin navigates to the order in Admin UI
5. Admin clicks "Settle Payment" to move payment from "Authorized" to "Settled"

## Payment States

- **Authorized**: Payment is created with transaction ID, waiting for admin verification
- **Settled**: Admin has verified and settled the payment manually

## Validation

The plugin validates:
- Order total meets minimum order value requirement
- Transaction ID is provided and not empty
- Transaction ID is a valid string

If validation fails, the payment will be declined with an appropriate error message.


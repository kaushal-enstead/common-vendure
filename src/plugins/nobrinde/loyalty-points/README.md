# Loyalty Points Plugin

## 📝 Introduction

A comprehensive loyalty points system for Vendure e-commerce platform that enables customers to earn, redeem, and manage loyalty points. This plugin provides a complete points-based reward system with promotional discounts, point allocation, transaction history, and seamless integration with Vendure's admin dashboard and promotion engine.

---

## ✨ Features

- **Points Earning System**: Automatically award loyalty points based on order value with configurable conversion rates
- **Points Redemption**: Redeem loyalty points for discounts through promotional actions
- **Point Allocation**: Admin can manually allocate points to specific customers or customer groups
- **Transaction History**: Complete audit trail of all point transactions (earn, redeem, reward)
- **Promotional Integration**: Built-in promotion actions and conditions for loyalty point discounts
- **Channel-Aware Settings**: Different loyalty settings per channel for multi-channel setups
- **Customer Wallet**: Custom fields for points, frozen points, and transaction history
- **Email Notifications**: Automated email notifications for point earning, redemption, and rewards
- **Admin Dashboard**: Modern UI for managing loyalty settings and point allocation
- **Multi-language Support**: Full support for English and Portuguese languages

---

## 🗄️ Data Models

The plugin introduces two main entities:

### LoyaltySettings
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  pointsPerEuro: Int! // Points awarded per euro spent
  maxRedeemablePoints: Int! // Maximum points that can be redeemed at once
  enableLoyaltyDiscount: Boolean! // Whether loyalty discounts are enabled
  loyaltyDiscount: Int! // Discount percentage when redeeming points
  channel: Channel // Channel-specific settings
  channelId: String!
}
```

### LoyaltyWalletHistory
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  customerId: ID!
  points: Int! // Points amount (positive for earn/reward, negative for redeem)
  balanceAfter: Int! // Customer's balance after this transaction
  prevBalance: Int! // Customer's balance before this transaction
  type: String! // 'earn', 'redeem', or 'reward'
  orderId: ID | null // Associated order (if applicable)
  source: String! // Source of the transaction
}
```

### Customer Custom Fields
The plugin adds the following custom fields to the Customer entity:
- `points`: Current loyalty points balance (readonly)
- `freezePoints`: Points temporarily frozen during redemption (readonly)
- `history`: Relation to LoyaltyWalletHistory entities (readonly)

---

## 🔒 Permissions

The plugin registers the following permissions:

| Permission Code | Description | Scope (Admin/Shop) |
| --------------- | ----------- | ------------------ |
| `LoyaltyPoints.Read` | Can read loyalty points data | Admin |
| `LoyaltyPoints.Create` | Can create loyalty points records | Admin |
| `LoyaltyPoints.Update` | Can update loyalty points settings and allocate points | Admin |
| `LoyaltyPoints.Delete` | Can delete loyalty points records | Admin |

---

## 🗃️ Database Schema

The plugin creates the following database tables:

### loyalty_settings
- Stores channel-specific loyalty program configuration
- Links to Channel entity for multi-channel support
- Contains conversion rates, discount settings, and redemption limits

### loyalty_wallet_history
- Audit trail for all loyalty point transactions
- Links to Customer and Order entities
- Tracks point changes with before/after balances

### Customer Custom Fields
- `points`: Integer field storing current point balance
- `freezePoints`: Integer field for temporarily frozen points
- `history`: Relation field linking to loyalty wallet history

---

## 📊 Dashboard Integrations

The plugin provides a custom dashboard extension with:

- **Loyalty Points Section**: Located under the "Loyalty points" section in the admin navigation with Medal icon
- **Settings Management**: Configure points per euro, maximum redeemable points, and loyalty discount percentage
- **Point Allocator**: Tree-based interface for allocating points to customer groups or individual customers
- **Customer Wallet Tab**: View customer point balances and transaction history in customer detail pages

---

## Installation

1. **Add the plugin to your Vendure configuration**:

```typescript
import { LoyaltyPointsPlugin } from './plugins/loyalty-points/loyalty-points.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    LoyaltyPointsPlugin.init({
      couponCode: 'LOYALTY_POINTS', // Required: Coupon code for loyalty point redemption
    }),
    // ... other plugins
  ],
};
```

2. **Run database migrations**:
```bash
npm run migration:run
```

3. **Configure email templates** (optional):
The plugin includes email handlers for loyalty point notifications. Ensure your email plugin is configured to handle these events and email templates are added in `static/email/templates/`.

---

## 🏗️ Project Structure

```
src/plugins/loyalty-points/
├── api/                          # GraphQL resolvers and schema extensions
│   ├── api-extensions.ts         # GraphQL schema definitions
│   ├── loyalty-admin.resolver.ts # Admin API resolvers
│   └── loyalty-shop-resolver.ts  # Shop API resolvers
├── dashboard/                    # Admin UI components
│   ├── index.tsx                # Dashboard extension definition
│   └── routes/                  # Dashboard routes and components
│       ├── settings/            # Loyalty settings management
│       └── allocator/           # Point allocation interface
├── entities/                     # TypeORM entities
│   ├── loyalty-settings.ts      # Loyalty settings entity
│   └── loyalty-wallet-history.entity.ts # Transaction history entity
├── events/                       # Event handling and email notifications
│   ├── event-handler.ts         # Email event handlers
│   └── event-types.ts           # Event type definitions
├── listener/                     # Event listeners
│   ├── loyalty-order.listener.ts # Order completion listener
│   └── coupon-code.listener.ts   # Coupon code listener
├── promotion/                    # Promotion system integration
│   ├── redeem-action.ts         # Loyalty point redemption action
│   └── minimum-one-adhered-seller.ts # Promotion condition
├── services/                     # Business logic services
│   ├── loyalty.service.ts       # Core loyalty service
│   └── customer-group.service.ts # Customer group management
├── gql/                         # Generated GraphQL types
├── constants.ts                 # Plugin constants and permissions
├── types.ts                     # TypeScript type definitions
├── custom-fields.d.ts          # Custom field type definitions
└── loyalty-points.plugin.ts    # Main plugin definition
```

---

## GraphQL API

The plugin provides comprehensive GraphQL APIs for both Admin and Shop contexts:

### Admin API

**Queries:**
- `getLoyaltySettings`: Retrieve loyalty program settings
- `getCustomerGroups`: Get customer groups for point allocation

**Mutations:**
- `updateLoyaltySettings`: Update loyalty program configuration
- `allocateLoyaltyPoints`: Manually allocate points to customers

### Shop API

**Queries:**
- `getLoyaltyPointSettings`: Get customer's loyalty point information and eligibility
---

## 🎯 Key Features Explained

### Points Earning
- Points are automatically awarded when orders are completed
- Conversion rate is configurable per channel (points per euro)
- Points are added to customer's balance and transaction history is recorded

### Points Redemption
- Customers can redeem points through promotional coupons
- Redemption is subject to minimum point requirements and seller adherence
- Points are temporarily frozen during redemption process
- Discount percentage is configurable per channel

### Point Allocation
- Admins can manually allocate points to customers or customer groups
- Tree-based interface for selecting target customers
- Allocation creates reward-type transactions in history

### Promotion Integration
- Custom promotion action: "Redeem loyalty points for discount"
- Custom promotion condition: "Minimum one adhered seller"

### Email Notifications
- Automatic emails for point earning, redemption, and rewards
- Multi-language support (English/Portuguese)
- Configurable email templates through Vendure's email plugin

---

## 🔧 Configuration Options

The plugin requires one configuration option:

- `couponCode`: The coupon code used for loyalty point redemption promotions

Example:
```typescript
LoyaltyPointsPlugin.init({
  couponCode: 'LOYALTY_POINTS'
})
```

---

## 📧 Email Templates

The plugin provides three email event handlers:

1. **loyalty-points-earn**: Sent when points are earned from orders
2. **loyalty-points-redeem**: Sent when points are redeemed for discounts  
3. **loyalty-points-reward**: Sent when points are manually allocated

Each handler supports multiple languages and includes relevant transaction details.

---

## 🔄 Event Flow

1. **Order Completion**: `LoyaltyOrderListener` awards points based on order value
2. **Point Redemption**: Customer applies loyalty coupon, points are frozen and discount applied
3. **Manual Allocation**: Admin allocates points through dashboard, creates reward transaction
4. **Email Notifications**: Appropriate email is sent for each transaction type

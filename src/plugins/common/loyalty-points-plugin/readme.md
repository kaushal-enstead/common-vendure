# Loyalty Points Plugin for Vendure

A comprehensive loyalty points system for Vendure, providing each customer with a dedicated loyalty wallet, wallet history, and flexible seller-specific loyalty discount options. The plugin is highly configurable via global settings and supports advanced workflows for earning, freezing, and redeeming points.

## Key Concepts

### 1. Customer Loyalty Wallet

- **Virtual Wallet**: Each customer has a dedicated loyalty wallet, separate from other balances.
- **Points & Freeze Points**: 
  - `points`: Total available points.
  - `freezePoints`: Points reserved (frozen) for pending orders or promotions.
- **Wallet History**: Every point transaction (earn, spend, freeze, unfreeze) is recorded and visible in the wallet history.
- **UI Integration**: 
  - Show current points and frozen points in the customer account area.
  - Display information about the current point-to-currency conversion rate.

### 2. Global Settings

- **Currency Rate**: Set how many points are earned per currency unit (e.g., 10€ = 1 point, or as configured).
- **Max Redeemable Points**: Limit the number of points a customer can redeem in a single transaction.

### 3. Seller-Specific Settings

- **Adhere to Loyalty**: Sellers can choose whether to participate in the loyalty program.
- **Discount Input**: If participating, sellers specify the discount percentage (input box in admin UI).
- **Frontend Display**: Show on the shop frontend how much discount is offered by each seller when redeeming points.

## Technical Workflow

1. **Customer Custom Fields** (readonly in admin/shop UI):
    - `points`
    - `freezePoints`
    - `walletHistory` (relation)
2. **Seller Custom Fields**:
    - `enableDiscount` (boolean)
    - `loyaltyDiscount` (int, input)
3. **Global Settings Custom Fields**:
    - `pointsPerEuro` (labelled as "Points per X currency")
    - `maxRedeemablePoints` (number of points)
4. **Discount Application**:
    - Discount is applied via promotion action.
    - Promotion is auto-created for the default seller only and is not visible to other sellers or customers.
    - Coupon code is managed internally; customers/sellers do not see or use it directly.
5. **Wallet & Points Logic**:
    - On order placement: freeze points, then burn (spend) on completion, and award new points (all with wallet history).
    - On promotion events: freeze/unfreeze required points.
    - All point changes are logged in the wallet history table.
    - For each order line, if the seller participates, apply the configured discount percentage.
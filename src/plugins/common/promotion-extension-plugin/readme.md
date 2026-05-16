# Custom Promotion Plugin

A Vendure plugin that extends the promotion system with channel-specific discount actions and conditions. This plugin allows you to create promotions that apply discounts only to products from specific channels, enabling multi-vendor marketplace scenarios.

## Features

### Promotion Actions

1. **Percentage Discount** (`discount-by-percentage`)
   - Applies a percentage discount to order lines from the current channel
   - Supports maximum discount limits
   - Only applies to products from the promotion's associated channel

2. **Fixed Amount Discount** (`discount-by-fix-amount`)
   - Applies a fixed amount discount to order lines from the current channel
   - Ensures the discount doesn't exceed the unit price
   - Only applies to products from the promotion's associated channel

3. **Free Shipping** (`free-shipping-for-channel-products`)
   - Provides free shipping for products from the current channel
   - Only applies to shipping methods associated with the promotion's channel

4. **Redeem Loyalty Points** (`redeem-loyalty-points`)
   - Allows customers to redeem their loyalty points for a discount on their order
   - The number of points to redeem is provided by the customer at checkout
   - The maximum points that can be redeemed and the value per point are configurable in global settings
   - The discount is capped so it cannot exceed the order total

### Promotion Conditions

1. **Product Belongs to Channel** (`product-belongs-to-channel`)
   - Ensures promotions only apply to products from the current channel
   - Validates that all order items belong to the same channel as the promotion
   - Throws an error if items from other channels are present

2. **Minimum Order Amount for Channel** (`minimum_order_amount_for_channel`)
   - Requires the order total (for products from the promotion's channel) to be greater than or equal to a specified amount
   - Only considers order lines belonging to the promotion's associated channel
   - Supports configuration for tax-inclusive or tax-exclusive calculation
   - If the condition is not met, the promotion will not apply

### API Extensions

The plugin extends the Shop API with promotion queries:
- `promotion(id: ID!)` - Get a single promotion by ID
- `promotions(options: PromotionListOptions)` - Get a paginated list of promotions

## Installation

1. Install the plugin in your Vendure project:

```bash
npm install @your-org/custom-promotion-plugin
```

2. Add the plugin to your Vendure configuration:

```typescript
import { CustomPromotionPlugin } from '@your-org/custom-promotion-plugin';

export const config: VendureConfig = {
    plugins: [
        CustomPromotionPlugin.init({
            // Optional configuration options
            exampleOption: 'value'
        }),
        // ... other plugins
    ],
    // ... rest of config
};
```

## Usage

### Creating Channel-Specific Promotions

1. **Set up your channels** in the Vendure admin
2. **Create a promotion** with one of the custom actions:
   - Select "Discount by Percentage" or "Discount by Fixed Amount" for item discounts
   - Select "Free Shipping for Channel Products" for shipping discounts
3. **Add the "Product Belongs to Channel" condition** to ensure the promotion only applies to the correct channel
4. **Assign the promotion to the appropriate channel** in the promotion settings

### Example Promotion Setup

1. Create a promotion with:
   - **Action**: "Discount by Percentage" with 10% discount
   - **Condition**: "Product Belongs to Channel"
   - **Channel**: Assign to your vendor's channel
   - **Coupon Code**: "VENDOR10"

2. The promotion will only apply to products from that specific vendor's channel

### API Usage

Query available promotions:

```graphql
query {
  promotions {
    items {
      id
      name
      couponCode
      enabled
      conditions {
        code
        args
      }
      actions {
        code
        args
      }
    }
  }
}
```

Get a specific promotion:

```graphql
query {
  promotion(id: "1") {
    id
    name
    couponCode
    enabled
    conditions {
      code
      args
    }
    actions {
      code
      args
    }
  }
}
```

## Configuration

The plugin accepts the following configuration options:

```typescript
interface PluginInitOptions {
    exampleOption?: string;
}
```

Currently, the configuration is minimal but can be extended for future features.

## How It Works

### Channel Validation

The plugin validates that promotions only apply to products from the correct channel by:

1. Extracting the coupon code from the request
2. Finding the promotion and its associated channels
3. Checking if the order items belong to the promotion's channel
4. Applying discounts only to eligible items

### Multi-language Support

All promotion actions and conditions support multiple languages:
- English (`en`)
- Portuguese (`pt`)

### Tax Handling

The plugin automatically handles tax-inclusive and tax-exclusive pricing based on the channel configuration.

## Development

### Adding New Actions

To add a new promotion action:

1. Create a new file in `promotion/actions/`
2. Export a `PromotionItemAction` or `PromotionShippingAction`
3. Add the action to the plugin configuration in `custom-promotion.plugin.ts`

### Adding New Conditions

To add a new promotion condition:

1. Create a new file in `promotion/conditions/`
2. Export a `PromotionCondition`
3. Add the condition to the plugin configuration in `custom-promotion.plugin.ts`
# Pre-Order Inquiry Plugin

A Vendure plugin that enables customers to submit pre-order inquiries for products and allows administrators to manage and track these requests throughout their lifecycle.

## Overview

The Pre-Order Inquiry Plugin extends Vendure's core functionality by allowing customers to express interest in products that can be pre-ordered. This bridges the gap between customer demand and inventory management, enabling businesses to better understand demand and plan restocking or product launches accordingly.

## Features

### Customer Features

- **Submit Pre-Order Requests**: Customers can create pre-order inquiries for any product variant
- **Track Request Status**: View the status of submitted pre-order requests
- **Cancel Requests**: Cancel pending pre-order requests
- **Convert to Order**: Convert accepted pre-orders into actual orders

### Admin Features

- **Manage Pre-Orders**: Administrators can view and manage all pre-order inquiries.
- **Status Management**: Update pre-order status (Pending, Accepted, Refused, etc.).
- **Bulk Operations**: Accept multiple pre-orders at once.
- **Customer Communication**: Add messages to pre-orders for customer communication.
- **Analytics**: Track pre-order demand for inventory planning.

### Automated Listener Features

- **Order Integration**: The plugin includes a listener that automatically marks pre-orders as completed when an order is placed for a pre-ordered item.
- **Cleanup on Order Line Events**: If an order line associated with a pre-order is deleted or cancelled, the listener will automatically delete the corresponding pre-order record.
- **Event-Driven Updates**: The listener leverages Vendure's event bus to keep pre-order data in sync with order lifecycle events, reducing manual admin intervention.

## Pre-Order Statuses

The plugin supports the following status workflow:

- **PENDING**: Initial status when a pre-order is created
- **ACCEPTED**: Admin has accepted the pre-order request
- **CUSTOMER_ACCEPTED**: Customer has confirmed the accepted pre-order
- **REFUSED**: Admin has refused the pre-order request
- **CHANGE_PROPOSED**: Admin has proposed changes to the pre-order
- **COMPLETED**: Pre-order has been converted to an actual order

## Installation

1. Install the plugin in your Vendure project
2. Add the plugin to your Vendure configuration:

```typescript
import { PreOrderInquiryPlugin } from './plugins/pre-order-inquiry-plugin/pre-order-inquiry.plugin';

export const config: VendureConfig = {
    plugins: [
        PreOrderInquiryPlugin.init({
            // Optional configuration options
        }),
    ],
    // ... other config
};
```

## GraphQL API

### Admin API

The plugin extends the Admin API with the following operations:

**Queries:**

- `preOrder(id: ID!)`: Get a specific pre-order by ID
- `preOrders(options: PreOrderListOptions)`: Get paginated list of pre-orders

**Mutations:**

- `createPreOrder(input: CreatePreOrderInput!)`: Create a new pre-order
- `updatePreOrder(input: UpdatePreOrderInput!)`: Update an existing pre-order
- `acceptPreOrder(id: ID!)`: Accept a pre-order
- `acceptMultiplePreOrders(preOrderIds: [ID!]!)`: Accept multiple pre-orders
- `cancelPreOrder(id: ID!)`: Cancel a pre-order

### Shop API

The plugin extends the Shop API with customer-facing operations:

**Queries:**

- `myPreOrders(options: PreOrderListOptions)`: Get customer's pre-orders

**Mutations:**

- `createPreOrder(input: CreatePreOrderInput!)`: Create a new pre-order
- `cancelPreOrder(id: ID!)`: Cancel a pre-order
- `convertToOrder(id: ID!)`: Convert an accepted pre-order to an order

## Admin UI

The plugin provides a dedicated admin interface accessible at `/admin/pre-orders` that includes:

- Pre-order list with filtering and pagination
- Pre-order detail view
- Status management interface
- Bulk operations panel
- Customer communication tools

## Data Model

The plugin introduces a `PreOrder` entity with the following properties:

- `id`: Unique identifier
- `quantity`: Requested quantity
- `customer`: Associated customer (optional)
- `productVariant`: The product variant being requested
- `status`: Current status of the pre-order
- `message`: Optional message for communication
- `acceptedAt`: Timestamp when the pre-order was accepted
- `channels`: Associated sales channels
- `deletedAt`: Soft delete timestamp

## Permissions

The plugin adds custom permissions for pre-order management:

- `CreatePreOrder`: Create new pre-orders
- `ReadPreOrder`: View pre-order details
- `UpdatePreOrder`: Modify pre-orders
- `DeletePreOrder`: Delete pre-orders

## Configuration Options

The plugin can be configured with the following options:

```typescript
interface PluginInitOptions {
    exampleOption?: string;
}
```

# Custom Shipping Plugin

A Vendure 3.x plugin that provides weight-based, zone-driven shipping with support for free-shipping thresholds, manual quotes for out-of-region orders, and a custom React admin UI for configuring rates per zone.

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [How It Works](#how-it-works)
  - [Zone Resolution](#zone-resolution)
  - [Pricing Logic](#pricing-logic)
  - [Manual Quote Flow](#manual-quote-flow)
  - [Eligibility Check](#eligibility-check)
  - [Payment Eligibility](#payment-eligibility)
- [Custom Fields Added](#custom-fields-added)
- [Bootstrap Behaviour](#bootstrap-behaviour)
- [GraphQL Admin API](#graphql-admin-api)
- [Email Notification](#email-notification)
- [Dashboard UI](#dashboard-ui)
- [Constants & Codes](#constants--codes)
- [Zone Rate Data Structure](#zone-rate-data-structure)
- [Default Zones](#default-zones)
- [Registration](#registration)

---

## Overview

| Concern | Implementation |
|---|---|
| Shipping calculator | `customShippingCalculator` — weight × rate per zone |
| Eligibility checker | `customShippingChecker` — weight bounds + seller channel match |
| Payment eligibility | `customPaymentEligibilityChecker` — blocks payment while manual quote is PENDING |
| Fulfillment handler | `customShippingFulfillmentHandler` — stores optional tracking code |
| Admin GraphQL | `updateShippingMethod` override + `customShippingQuoteState` query + `customSetShippingQuote` mutation |
| Email | `customShippingQuoteReadyHandler` — notifies customer when quote is ready |
| Bootstrap | Auto-creates countries, zones, and default shipping method on application start |
| Dashboard | `ZoneRatesEditor` — custom form component for editing zone rate JSON inline |

---

## File Structure

```
custom-shipping-plugin/
├── custom-shipping.plugin.ts           # Plugin class, config hooks, custom fields
├── constants.ts                        # Codes and quote status constants
├── types.ts                            # ZoneRateEntry type, DEFAULT_ZONE_RATES, parseZoneRates()
├── destination.ts                      # Zone resolver and weight helpers
├── calculator/
│   └── custom-shipping-calculator.ts  # ShippingCalculator: weight × rate or manual quote
├── checker/
│   ├── custom-shipping-checker.ts     # ShippingEligibilityChecker: weight + channel validation
│   └── custom-payment-eligibility.checker.ts  # PaymentMethodEligibilityChecker
├── handler/
│   └── custom-shipping-handler.ts     # FulfillmentHandler with optional tracking code
├── resolver/
│   └── custom-shipping.admin.resolver.ts  # Admin mutations/queries for manual quotes
├── api/
│   └── api-extensions.ts              # Admin GraphQL SDL
├── events/
│   ├── event-types.ts                 # CustomShippingQuoteReadyEvent
│   └── event-handler.ts              # Email listener for quote-ready event
├── services/
│   └── custom-shipping-bootstrap.service.ts  # Auto-seeds countries, zones, shipping method
└── dashboard/
    ├── index.tsx                      # Dashboard extension registration
    └── components/
        └── zone-rates-editor.tsx      # React component: editable zone-rate table
```

---

## How It Works

### Zone Resolution

`destination.ts` → `resolveShippingZone()`

1. Loads all Vendure `Zone` records, filtered to only those listed in the shipping method's `zoneRates` arg.
2. Sorts zones by `Zone.customFields.shippingZonePriority` ascending (lower = matched first).
3. For each zone in order:
   - If the zone name contains "island" or "ilha" (case-insensitive), it is a **Portugal Islands** zone.
     - Matches only if the order address has a PT postal code in Madeira (9000–9399) or Azores (9500–9999).
     - Otherwise skipped — mainland PT addresses do not accidentally fall into this zone.
   - Otherwise matches if the order's `countryCode` is a member of the zone.
4. Returns the first match or `null` (no zone = not eligible for this shipping method).

**Portugal Islands postal code ranges:**
| Region | Range |
|---|---|
| Madeira | 9000–9399 |
| Azores | 9500–9999 |

### Pricing Logic

`calculator/custom-shipping-calculator.ts`

Priority order for a given zone match:

1. **Manual quote zone** (`requiresManualQuote: true`): returns the stored `customShippingQuoteAmount` if status is `READY`, else 0.
2. **Free shipping** (`freeShipping: true` and `order.subTotalWithTax >= minAmountCents`): returns 0.
3. **Weight-based**: `Math.round(weightKg × pricePerKgEUR × 100)` cents.

Order weight is the sum of `(variantWeight ?? productWeight) × quantity` across all lines.

### Manual Quote Flow

Used when a zone has `requiresManualQuote: true` (default: "Out of Europe").

```
Customer places order
      ↓
Eligibility checker passes (weight in bounds, seller channel match)
      ↓
Quote status = PENDING  →  payment blocked by customPaymentEligibilityChecker
      ↓
Admin reviews order → calls customSetShippingQuote mutation
      ↓
Quote status = READY, amount stored on order, note added, optional email sent
      ↓
Customer receives email → proceeds to payment
```

Quote statuses (see `constants.ts`):

| Constant | Value | Meaning |
|---|---|---|
| `CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED` | `NOT_REQUIRED` | Standard zone; no manual quote needed |
| `CUSTOM_SHIPPING_QUOTE_STATUS_PENDING` | `PENDING` | Manual-quote zone; waiting for admin |
| `CUSTOM_SHIPPING_QUOTE_STATUS_READY` | `READY` | Admin set the quote; payment unblocked |

### Eligibility Check

`checker/custom-shipping-checker.ts`

An order is eligible for this shipping method when **all** conditions are met:

1. Order has a shipping address and at least one line.
2. The shipping method is assigned to exactly **2 channels**: `__default_channel__` + one seller channel.
3. At least one order line belongs to that seller channel.
4. Every line for that seller has a weight > 0 (on `productVariant.customFields.weight` or `product.customFields.weight`).
5. Total order weight is within `minWeightKg` – `maxWeightKg` (checker args; defaults 0–200 kg).

### Payment Eligibility

`checker/custom-payment-eligibility.checker.ts`

Applied as a `PaymentMethodEligibilityChecker` on every payment method. Logic:

- If the order does **not** use the `custom-shipping` shipping method → always eligible.
- If `customShippingQuoteStatus` is `PENDING` → payment blocked.
- Otherwise (`NOT_REQUIRED` or `READY`) → payment allowed.

---

## Custom Fields Added

### `Zone`

| Field | Type | Default | Purpose |
|---|---|---|---|
| `shippingZonePriority` | `int` | `0` | Lower number = higher priority in zone resolution. Portugal Islands (0) must be lower than Portugal Mainland (1). |

### `Order`

| Field | Type | Default | Purpose |
|---|---|---|---|
| `customShippingQuoteStatus` | `string` | `NOT_REQUIRED` | Quote lifecycle state |
| `customShippingQuoteAmount` | `int` (nullable) | `null` | Quote amount in cents (tax-inclusive) |
| `customShippingQuoteUpdatedAt` | `datetime` (nullable) | `null` | Timestamp of last quote update |
| `customShippingDestination` | `string` (nullable) | `null` | Resolved zone name stamped by the checker |

---

## Bootstrap Behaviour

`services/custom-shipping-bootstrap.service.ts` runs on `onApplicationBootstrap` and is **idempotent**:

1. **Countries**: Checks the `region` table via raw SQL. Creates any missing country records (44 European + PT/ES/FR).
2. **Zones**: Creates the 6 default zones if missing, or backfills members if a zone exists with 0 members.
3. **Shipping method**: Creates the `custom-shipping` shipping method in the default channel if it doesn't exist.

No action is taken if the data already exists — safe to run on every boot.

---

## GraphQL Admin API

### Query

```graphql
customShippingQuoteState(orderId: ID!): CustomShippingQuoteState!
```

Returns:
```graphql
type CustomShippingQuoteState {
  orderId: ID!
  status: String!             # NOT_REQUIRED | PENDING | READY
  destination: String         # resolved zone name
  shippingAmountWithTax: Int  # cents, null until set
  currencyCode: String!
}
```

Required permissions: `ReadOrder`, `UpdateOrder`

### Mutation — set manual quote

```graphql
customSetShippingQuote(input: CustomSetShippingQuoteInput!): Order!

input CustomSetShippingQuoteInput {
  orderId: ID!
  shippingAmountWithTax: Int!   # amount in cents, tax-inclusive
  notifyCustomer: Boolean = true
}
```

What it does:
- Sets `customShippingQuoteStatus = READY`
- Stores `customShippingQuoteAmount` on the order
- Records `customShippingQuoteUpdatedAt = now()`
- Adds a public order note: `Shipping quote set: X.XX EUR`
- If `notifyCustomer` is true and customer has an email, publishes `CustomShippingQuoteReadyEvent`

Required permissions: `UpdateOrder`, `ReadCustomer`

### Mutation — `updateShippingMethod` (override)

The plugin overrides the default `updateShippingMethod` admin mutation. When a shipping method using the `custom-shipping-fulfillment` handler is updated and the `calculator` or `checker` arg changes, the same args are automatically propagated to all **sibling** shipping methods that share the same fulfillment handler. This keeps zone rates in sync across multiple channel-specific shipping methods.

---

## Email Notification

`events/event-handler.ts` — listener key: `custom-shipping-quote-ready`

Triggered by `CustomShippingQuoteReadyEvent`. Register in `EmailPlugin.init()`:

```ts
EmailPlugin.init({
  handlers: [
    ...CustomShippingPlugin.emailHandlers,
    // other handlers
  ],
})
```

Template variables available:

| Variable | Description |
|---|---|
| `orderCode` | Order reference code |
| `shippingAmountWithTax` | Formatted amount e.g. `"19.90"` |
| `currencyCode` | e.g. `"EUR"` |

Subject lines are language-aware (EN / PT).

Email template path: `static/email-templates/custom-shipping-quote-ready/` (standard Vendure email template structure; create `body.hbs` and `subject.hbs` or `template.{lang}.hbs`).

---

## Dashboard UI

`dashboard/components/zone-rates-editor.tsx`

Registered as a custom form component with ID `custom-shipping-zone-rates-editor`. It is used as the `ui.component` for the `zoneRates` calculator arg, replacing the default JSON text area with an inline editable table.

Columns:

| Column | Control |
|---|---|
| Zone name | `<Select>` populated from live Vendure zones API |
| Price per kg (EUR) | `<MoneyInput>` |
| Free shipping | `<Switch>` |
| Min amount (EUR) | `<MoneyInput>` (visible only when free shipping is enabled) |
| Manual quote | `<Switch>` |
| Actions | Delete row button |

An "Add zone" button appends a blank row. Changes serialize to JSON and call `onChange` immediately.

---

## Constants & Codes

| Constant | Value |
|---|---|
| `CUSTOM_SHIPPING_METHOD_CODE` | `custom-shipping` |
| `CUSTOM_SHIPPING_FULFILLMENT_CODE` | `custom-shipping-fulfillment` |
| Calculator code | `custom-shipping-calculator` |
| Checker code | `custom-shipping-checker` |
| Payment eligibility checker code | `custom-payment-eligibility-checker` |
| Logger context | `CustomShippingPlugin` |

---

## Zone Rate Data Structure

Each entry in the `zoneRates` JSON array:

```ts
type ZoneRateEntry = {
  zoneName: string;             // must exactly match a Vendure Zone.name (case-sensitive)
  pricePerKgEUR: number;        // rate per kg in EUR
  freeShipping: boolean;        // enable free shipping threshold for this zone
  minAmountEUR: number;         // order subtotal threshold for free shipping (EUR)
  requiresManualQuote: boolean; // block payment until admin provides a quote
};
```

`parseZoneRates()` in `types.ts` is the canonical parser. It handles the legacy `freeShippingThresholdEUR` field name and returns `[]` on any parse error so callers fail gracefully.

---

## Default Zones

Created automatically at bootstrap. Zone names are **case-sensitive** and must match exactly in `zoneRates`.

| Zone Name | Countries | Priority | Manual Quote Default |
|---|---|---|---|
| `Portugal Islands` | PT (islands only by postal code) | 0 | No |
| `Portugal Mainland` | PT | 1 | No |
| `Spain` | ES | 2 | No |
| `France` | FR | 2 | No |
| `Europe` | All other European countries | 3 | No |
| `Out of Europe` | (none — catches remaining) | 9 | **Yes** |

"Out of Europe" has no country members; it serves as a fallback when no other zone matches. Its `requiresManualQuote` defaults to `true` in `DEFAULT_ZONE_RATES`.

---

## Registration

`src/vendure-config.ts`:

```ts
import { CustomShippingPlugin } from './plugins/custom-shipping-plugin/custom-shipping.plugin';

plugins: [
  CustomShippingPlugin.init(),
  EmailPlugin.init({
    handlers: [
      ...CustomShippingPlugin.emailHandlers,
      // other handlers
    ],
  }),
]
```

No additional entities are defined, but the `Zone` and `Order` custom fields added via the `configuration` hook require a database migration. Run `npm run db:migrate` after first adding the plugin.

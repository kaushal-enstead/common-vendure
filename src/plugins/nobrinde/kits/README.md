## 🧩 Kits Plugin

### 📝 Introduction

A flexible product kit/bundle system for the Vendure e‑commerce platform.  
This plugin allows administrators to define **kits** composed of multiple product variants, manage their translations and assets, and expose them in a structured way to the admin dashboard.

---

### ✨ Features

- **Kit Management**: Create and manage kits which group multiple product variants into a single conceptual bundle.
- **Variant Composition**: Define kit items via `KitVariant` entries (with quantity and discount per item).
- **Assets & Featured Media**: Attach multiple assets to a kit and configure a featured asset.
- **Translations**: Localized name, slug and description via `KitTranslation`.
- **Channel Awareness & Facets**: Assign kits to channels and facet values.
- **Customer Linking**: Optionally associate kits to a specific customer.
- **Admin Dashboard Integration**: Modern UI built with Vendure's dashboard extension system.
- **Role-based Permissions**: CRUD-style permission set for kit management.

---

### 🗄️ Data Models

The plugin introduces the following main entities:

#### Kit

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
  name: LocaleString!
  slug: LocaleString!
  description: LocaleString!
  type: KitType!           // Admin, Customer
  enabled: Boolean!
  customer: Customer
  customerId: ID
  featuredAsset: Asset
  featuredAssetId: ID
  assets: [KitAsset!]!
  translations: [KitTranslation!]!
  variants: [KitVariant!]!
  facetValues: [FacetValue!]!
  channels: [Channel!]!
}
```

#### KitVariant

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  kit: Kit!
  kitId: ID!
  productVariant: ProductVariant!
  productVariantId: ID!
  quantity: Int!
  discount: Int! // percentage or unit amount depending on implementation
}
```

#### KitTranslation

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  languageCode: LanguageCode!
  name: String!
  slug: String!
  description: String!
  base: Kit!
}
```

#### KitAsset

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  kit: Kit!
  kitId: ID!
  asset: Asset!
  position: Int!
}
```

---

### 🔒 Permissions

The plugin registers the following CRUD-style permission set:

| Permission Code    | Description                  | Scope (Admin/Shop) |
| ------------------ | ---------------------------- | ------------------ |
| `Kit.Read`         | Can read kits                | Admin              |
| `Kit.Create`       | Can create kits              | Admin              |
| `Kit.Update`       | Can update kits              | Admin              |
| `Kit.Delete`       | Can delete kits              | Admin              |

> These permissions are added to `authOptions.customPermissions` by the plugin.

---

### 📊 Dashboard Integrations

The plugin provides a custom dashboard extension with:

- **Kits Section**: Admin navigation section for listing, creating and editing kits.
- **Kit Detail View**: Configure general info, translations, assets and facets.
- **Kit Variant Management**: Add/remove product variants, set quantities and discounts.

---

### Installation

1. **Add the plugin to your Vendure configuration**:

```ts
import { KitPlugin } from './plugins/kits/kits.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    KitPlugin.init({
      // Plugin options (currently none required)
    }),
    // ... other plugins
  ],
};
```

2. **Run database migrations** to create the `Kit`, `KitVariant`, `KitTranslation` and `KitAsset` tables.

---

### 🏗️ Project Structure

```text
src/plugins/kits/
├── api/                    # GraphQL resolvers and schema extensions
│   ├── api-extensions.ts
│   ├── kit.resolver.ts
│   └── kit.entity.resolver.ts
├── dashboard/              # Admin UI components
│   ├── index.tsx           # Dashboard extension definition
│   └── routes/             # Dashboard routes and components
├── entity/                 # TypeORM entities
│   ├── kit.entity.ts
│   ├── kit-variant.entity.ts
│   ├── kit-translation.entity.ts
│   └── kit-asset.entity.ts
├── gql/                    # Generated GraphQL types
├── services/               # Business logic services
│   ├── kit.service.ts
│   └── kit-variant.service.ts
├── constants.ts            # Plugin constants and permissions
├── types.ts                # TypeScript type definitions
└── kits.plugin.ts          # Main plugin definition
```

---

### GraphQL API (Admin)

The plugin exposes GraphQL APIs on the **Admin** API.  
Typical operations include:

- **Queries**: `kits`, `kit`
- **Mutations**: `createKit`, `updateKit`, `deleteKit`, `addKitVariant`, `updateKitVariant`, `deleteKitVariant`, etc.



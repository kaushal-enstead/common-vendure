## 📝 Custom CMS Plugin

### 📝 Introduction

A comprehensive Content Management System (CMS) for the Vendure e-commerce platform.  
This plugin provides a flexible and powerful content management solution with multiple content types including pages, banners, alerts, FAQs, news articles, headers, footers, and documents. It features a modern admin dashboard with drag-and-drop page builders, multi-language support, and channel-aware content delivery.

---

### ✨ Features

- **Multi-Content Type Support**: Manage diverse content types including pages, banners, alerts, FAQs, news, headers, footers, and documents.
- **Page Builder**: Advanced drag-and-drop page builder with customizable blocks and columns.
- **Translation Support**: Full localization via translation entities for all content types.
- **Channel Awareness**: Assign content to specific channels for multi-store setups.
- **Asset Management**: Attach and manage media assets with featured asset support.
- **Author Management**: Create and manage content authors with translation support.
- **Category System**: Organize news and other content with a flexible category system.
- **SEO Optimization**: Built-in SEO fields for meta titles, descriptions, and images.
- **Flexible Navigation**: Header and footer builders with nested navigation support.
- **Alert System**: Create targeted alerts with URL-based display rules and custom buttons.
- **Role-based Permissions**: Granular CRUD-style permission sets for each content type.

---

### 🗄️ Data Models

The plugin introduces the following main content entities:

#### Page

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  title: String!
  slug: String
  active: Boolean!
  seo: PageSeo           // { title, image, description }
  blocks: [PageBlock!]!
  channels: [Channel!]!
}
```

#### PageBlock

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  blockName: LocaleString!
  index: Int!
  collapsible: Boolean!
  blockType: String!     // section, container, etc.
  layout: String         // JSON string for column configuration
  customCss: String
  page: Page!
  translations: [PageBlockTranslation!]!
}
```

#### Banner

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  code: String!          // Unique identifier
  title: LocaleString!
  items: BannerItem[]    // Array of banner slides with assets and buttons
  active: Boolean!
  translations: [BannerTranslation!]!
  channels: [Channel!]!
}
```

#### Alert

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: String!
  description: LocaleString!
  targetUrls: String[]   // URLs where alert should display
  backgroundColor: String
  textColor: String
  button: AlertButton    // Optional CTA button
  active: Boolean!
  translations: [AlertTranslation!]!
  channels: [Channel!]!
}
```

#### News

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  title: LocaleString!
  slug: LocaleString!
  shortDescription: LocaleString!
  content: LocaleString!
  publishDate: DateTime
  active: Boolean!
  featuredAsset: Asset
  author: Author
  categories: [Category!]!
  translations: [NewsTranslation!]!
  channels: [Channel!]!
}
```

#### Header

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  code: String!          // Unique identifier
  navLinks: NavLink[]    // Nested navigation structure
  active: Boolean!
  translations: [HeaderTranslation!]!
  channels: [Channel!]!
}
```

#### Footer

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  code: String!          // Unique identifier
  navLinks: NavLink[]    // Navigation columns
  socialLinks: SocialLink[]
  logo: String           // Asset ID
  active: Boolean!
  translations: [FooterTranslation!]!
  channels: [Channel!]!
}
```

#### FAQ

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  items: FaqItem[]       // Array of question-answer pairs
  active: Boolean!
  category: Category
  translations: [FaqTranslation!]!
  channels: [Channel!]!
}
```

#### Document

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: LocaleString!
  items: DocumentItem[]  // Array of documents with assets
  active: Boolean!
  translations: [DocumentTranslation!]!
  channels: [Channel!]!
}
```

#### Author

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: LocaleString!
  bio: LocaleString
  avatar: Asset
  active: Boolean!
  translations: [AuthorTranslation!]!
}
```

#### Category

```ts
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: String!
  slug: String!
  active: Boolean!
}
```

---

### 📊 Dashboard Integrations

The plugin provides comprehensive dashboard extensions with:

- **CMS Section**: Dedicated admin navigation section for all content types.
- **Page Builder**: Visual drag-and-drop interface for creating complex page layouts with blocks and columns.
- **Content Lists**: Filterable, sortable lists for all content types with bulk actions.
- **Rich Editors**: Form-based editors with translation support for all content types.
- **Asset Management**: Integrated asset pickers for managing images and media.
- **Navigation Builders**: Intuitive builders for creating nested navigation in headers and footers.
- **Category Management**: Organize and manage content categories.
- **Author Management**: Create and manage content authors.
- **SEO Tools**: Built-in SEO fields for optimizing content for search engines.

---

### Installation

1. **Add the plugin to your Vendure configuration**:

```ts
import { CmsPlugin } from './plugins/custom-cms-plugin/custom-cms.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    CmsPlugin.init({
      // Plugin options
    }),
    // ... other plugins
  ],
};
```

2. **Run database migrations** to create all CMS-related tables including:
   - `payload_page`, `payload_page_block`, `payload_page_block_translation`
   - `payload_banner`, `payload_banner_translation`
   - `payload_alert`, `payload_alert_translation`
   - `payload_news`, `payload_news_translation`
   - `payload_header`, `payload_header_translation`
   - `payload_footer`, `payload_footer_translation`
   - `payload_faq`, `payload_faq_translation`
   - `payload_document`, `payload_document_translation`
   - `payload_author`, `payload_author_translation`
   - `payload_category`

---

### 🏗️ Project Structure

```text
src/plugins/custom-cms-plugin/
├── api/                           # GraphQL resolvers and schema extensions
│   ├── admin-api.ts               # Main API extensions
│   ├── alert/
│   │   ├── alert-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── author/
│   │   ├── author-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── banner/
│   │   ├── banner-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── category/
│   │   ├── category-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── document/
│   │   ├── document-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── faq/
│   │   ├── faq-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── footer/
│   │   ├── footer-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── header/
│   │   ├── header-admin.resolver.ts
│   │   └── api-extensions.ts
│   ├── news/
│   │   ├── news-admin.resolver.ts
│   │   └── api-extensions.ts
│   └── page-builder/
│       ├── page-admin.resolver.ts
│       ├── page-block-admin.resolver.ts
│       └── api-extensions.ts
├── dashboard/                     # Admin UI components
│   ├── index.tsx                  # Dashboard extension definition
│   ├── routes/                    # Dashboard routes and components
│   │   ├── alert/
│   │   ├── author/
│   │   ├── banner/
│   │   ├── category/
│   │   ├── document/
│   │   ├── faq/
│   │   ├── footer/
│   │   ├── header/
│   │   ├── news/
│   │   └── page-builder/
│   └── shared/                    # Shared dashboard components
│       ├── asset-field-with-picker.tsx
│       ├── css-editor-modal.tsx
│       ├── delete-bulk-action.tsx
│       ├── gql.ts
│       └── pickers.tsx
├── entities/                      # TypeORM entities
│   ├── alert/
│   │   ├── alert.entity.ts
│   │   └── alert-translation.entity.ts
│   ├── author/
│   │   ├── author.entity.ts
│   │   └── author-translation.entity.ts
│   ├── banner/
│   │   ├── banner.entity.ts
│   │   └── banner-translation.entity.ts
│   ├── category/
│   │   └── category.entity.ts
│   ├── document/
│   │   ├── document.entity.ts
│   │   └── document-translation.entity.ts
│   ├── faq/
│   │   ├── faq.entity.ts
│   │   └── faq-translation.entity.ts
│   ├── footer/
│   │   ├── footer.entity.ts
│   │   └── footer-translation.entity.ts
│   ├── header/
│   │   ├── header.entity.ts
│   │   └── header-translation.entity.ts
│   ├── news/
│   │   ├── news.entity.ts
│   │   └── news-translation.entity.ts
│   ├── news-category/
│   │   └── news-category.entity.ts
│   └── page-builder/
│       ├── page.entity.ts
│       ├── page-block.entity.ts
│       └── page-block-translation.entity.ts
├── gql/                           # Generated GraphQL types
│   └── generated.ts
├── services/                      # Business logic services
│   ├── alert.service.ts
│   ├── author.service.ts
│   ├── banner.service.ts
│   ├── category.service.ts
│   ├── document.service.ts
│   ├── faq.service.ts
│   ├── footer.service.ts
│   ├── header.service.ts
│   ├── news.service.ts
│   ├── page-block.service.ts
│   └── page-builder.service.ts
├── constants.ts                   # Plugin constants and permissions
├── types.ts                       # TypeScript type definitions
└── custom-cms.plugin.ts           # Main plugin definition
```

---

### GraphQL API (Admin)

The plugin exposes comprehensive GraphQL APIs on the **Admin** API.  

Typical operations include:

#### Pages
- **Queries**: `pages`, `page`
- **Mutations**: `createPage`, `updatePage`, `deletePage`, `createPageBlock`, `updatePageBlock`, `deletePageBlock`

#### Banners
- **Queries**: `banners`, `banner`
- **Mutations**: `createBanner`, `updateBanner`, `deleteBanner`

#### Alerts
- **Queries**: `alerts`, `alert`
- **Mutations**: `createAlert`, `updateAlert`, `deleteAlert`

#### News
- **Queries**: `newsItems`, `newsItem`
- **Mutations**: `createNews`, `updateNews`, `deleteNews`

#### Headers & Footers
- **Queries**: `headers`, `header`, `footers`, `footer`
- **Mutations**: `createHeader`, `updateHeader`, `deleteHeader`, `createFooter`, `updateFooter`, `deleteFooter`

#### FAQs & Documents
- **Queries**: `faqs`, `faq`, `documents`, `document`
- **Mutations**: `createFaq`, `updateFaq`, `deleteFaq`, `createDocument`, `updateDocument`, `deleteDocument`

#### Authors & Categories
- **Queries**: `authors`, `author`, `categories`, `category`
- **Mutations**: `createAuthor`, `updateAuthor`, `deleteAuthor`, `createCategory`, `updateCategory`, `deleteCategory`

---

### Advanced Features

#### Page Builder

The page builder supports:
- Drag-and-drop block arrangement
- Multiple column layouts (1-4 columns with custom ratios)
- Column types: Banners, Entities (products/collections), FAQs, Stats
- Custom CSS per block
- Collapsible sections
- Translation support for all content

#### Navigation Builders

Header and footer builders include:
- Nested navigation support (multi-level menus)
- Internal and external links
- Entity linking (products, collections, categories)
- Social media links (footer)
- Logo management

#### Alert System

Alerts feature:
- URL-based targeting (show on specific pages)
- Custom background and text colors
- Optional CTA buttons with internal/external links
- Channel and translation support

---

### Extension Points

The plugin is designed to be extensible:

- Add custom content types by following the existing entity patterns
- Extend GraphQL schema via the `adminApiExtensions` configuration
- Create custom dashboard routes in the `dashboard/routes` directory
- Add new column types to the page builder
- Extend existing services for custom business logic

---

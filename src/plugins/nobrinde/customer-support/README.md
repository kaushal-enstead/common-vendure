# Customer Support Plugin

## 📝 Introduction

A comprehensive customer support system for Vendure e-commerce platform that enables customers to create support tickets and allows administrators to manage them efficiently. This plugin provides a complete ticketing system with multilingual support, priority levels, and seamless integration with Vendure's admin dashboard.

---

## ✨ Features

- **Support Ticket Management**: Create, track, and manage support tickets with status tracking (OPEN, PENDING, CLOSED)
- **Priority System**: Support for LOW, MEDIUM, HIGH, and URGENT priority levels
- **Message Threading**: Full conversation history with messages from both customers and sellers
- **Support Subject Categories**: Organize tickets by subjects/categories with multilingual support
- **Channel Awareness**: Support tickets are channel-aware for multi-channel setups
- **Admin Dashboard Integration**: Modern UI built with Vendure's dashboard extension system
- **Role-based Permissions**: Separate permissions for support tickets and subjects
- **Customer Isolation**: Customers can only view and manage their own tickets

---

## 🗄️ Data Models

The plugin introduces three main entities:

### SupportTicket
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  description: String!
  status: SupportTicketStatus! // OPEN, PENDING, CLOSED
  priority: SupportTicketPriority! // LOW, MEDIUM, HIGH, URGENT
  customer: Customer
  customerId: String!
  channel: Channel
  channelId: String!
  subject: SupportSubject
  subjectId: String!
  messages: [SupportTicketMessage!]!
}
```

### SupportSubject
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  code: String!
  isActive: Boolean!
  name: String! // Translatable
  description: String! // Translatable
  translations: [SupportSubjectTranslation!]!
}
```

### SupportTicketMessage
```typescript
{
  id: String!
  content: String!
  sender: SupportTicketSender! // CUSTOMER, SELLER
  senderId: String!
  timestamp: DateTime!
  ticketId: String!
}
```

---

## 🔒 Permissions

The plugin registers the following permissions:

| Permission Code | Description | Scope (Admin/Shop) |
| --------------- | ----------- | ------------------ |
| `SupportTicket.Read` | Can read support tickets | Admin |
| `SupportTicket.Create` | Can create support tickets | Admin |
| `SupportTicket.Update` | Can update support tickets | Admin |
| `SupportTicket.Delete` | Can delete support tickets | Admin |
| `SupportSubject.Read` | Can read support subjects | Admin |
| `SupportSubject.Create` | Can create support subjects | Admin |
| `SupportSubject.Update` | Can update support subjects | Admin |
| `SupportSubject.Delete` | Can delete support subjects | Admin |

---

## 🗃️ Database Schema

The plugin creates the following database tables:

### support_ticket
- Primary table for storing support tickets
- Links to Customer, Channel, and SupportSubject entities
- Stores ticket metadata (status, priority, description)

### support_subject
- Categories for organizing support tickets
- Contains translatable name and description fields
- Has active/inactive state management

### support_subject_translation
- Stores translated content for support subjects
- Links to SupportSubject with language code
- Enables multilingual support

---

## 📊 Dashboard Integrations

The plugin provides a custom dashboard extension with:

- **Support Tickets Section**: Located under the "Support" section in the admin navigation
- **Support Subject Management**: Dedicated pages for managing support subjects with CRUD operations
---

## Installation

1. **Add the plugin to your Vendure configuration**:

```typescript
import { CustomerSupportPlugin } from './plugins/customer-support/customer-support.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    CustomerSupportPlugin.init({
      // Plugin options (currently none required)
    }),
    // ... other plugins
  ],
};
```

2. **Run database migrations**:
3. **Seed support subjects** (optional):

---

## 🏗️ Project Structure

```
src/plugins/customer-support/
├── api/                    # GraphQL resolvers and schema extensions
│   ├── api-extensions.ts   # GraphQL schema definitions
│   ├── support-subject.resolver.ts
│   ├── support-ticket.resolver.ts
│   └── support-ticker-shop.resolver.ts
├── dashboard/              # Admin UI components
│   ├── index.tsx          # Dashboard extension definition
│   └── routes/            # Dashboard routes and components
│   └── hooks/             # Dashboard hooks
├── entities/              # TypeORM entities
│   ├── support-subject.entity.ts
│   ├── support-subject-translation.entity.ts
│   └── support-ticket.entity.ts
├── services/              # Business logic services
│   ├── support-subject.service.ts
│   └── support-ticket.service.ts
├── gql/                   # Generated GraphQL types
├── constants.ts           # Plugin constants and permissions
├── types.ts              # TypeScript type definitions
├── customer-support.plugin.ts  # Main plugin definition
└── seed-support-subjects.ts    # Database seeding script
```

---

## GraphQL API

The plugin provides comprehensive GraphQL APIs for both Admin and Shop contexts:

### Admin API
- **Queries**: `supportSubjects`, `supportSubject`, `supportTickets`, `supportTicket`
- **Mutations**: `createSupportSubject`, `updateSupportSubject`, `deleteSupportSubject`, `updateSupportTicket`, `addSupportTicketMessage`, etc.

### Shop API
- **Queries**: `mySupportTickets`
- **Mutations**: `createSupportTicket`, `addSupportTicketMessage`
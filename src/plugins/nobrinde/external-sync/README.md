# External Sync Plugin

## 📝 Introduction

A bidirectional synchronization plugin for Vendure e-commerce platform that enables real-time and scheduled synchronization of data between Vendure and external databases. This plugin provides seamless data integration with configurable field mapping, batch processing, and support for multiple database tables.

---

## ✨ Features

- **Bidirectional Sync**: Real-time sync from Vendure to external database and scheduled sync from external database to Vendure
- **Event-Driven Sync**: Automatically syncs data when entities are created or updated in Vendure
- **Scheduled Batch Sync**: Configurable scheduled tasks to sync data from external database in batches
- **Field Mapping**: Flexible column mapping between Vendure and external database schemas
- **Batch Processing**: Configurable batch sizes for efficient large-scale synchronization
- **Sync Tracking**: Tracks last synchronization timestamp to enable incremental syncs
- **Multiple Table Support**: Supports syncing multiple tables (currently customers, extensible to products)
- **ID Mapping**: Maintains mapping between Vendure IDs and external database IDs

---

## 🗄️ Data Models

The plugin introduces one main entity:

### SyncTable
```typescript
{
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  tableName: String! // Unique identifier for the synced table (e.g., 'customers')
  lastSyncedAt: DateTime | null // Timestamp of last successful sync
}
```

### Custom Fields
The plugin adds the following custom field to the Customer entity:
- `mappingId`: Integer field storing the external database ID (readonly, unique)
- The same can be added to other entities as well with the same name.

---

## 🔄 Sync Modes

### 1. Real-Time Sync (Vendure → External DB)
- **Triggered by**: Customer creation/update events in Vendure
- **Process**: 
  - When a customer is created in Vendure, it's automatically created in the external database
  - When a customer is updated in Vendure, the external database record is updated
  - The external database ID is stored in the customer's `mappingId` custom field

### 2. Scheduled Sync (External DB → Vendure)
- **Triggered by**: Scheduled task (configurable cron schedule)
- **Process**:
  - Fetches records from external database that were modified since last sync
  - Maps external database columns to Vendure fields
  - Creates new customers if they don't exist, or updates existing ones based on `mappingId`
  - Updates the `lastSyncedAt` timestamp after successful sync

---

## 🔧 Configuration Options

The plugin requires the following configuration:

```typescript
import { SyncPlugin } from './plugins/external-sync/external-sync.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    SyncPlugin.init({
      externalDbUrl: 'mysql://user:password@host:port/database',
      tables: [
        {
          name: 'customers',
          vendureIdColumn: 'id',           // Primary key in Vendure
          remoteIdColumn: 'id',            // Primary key in external DB
          timestampColumn: 'updatedAt',    // Column for tracking changes
          vendureToRemote: {               // Map Vendure fields to external DB columns
            'vendureKey': 'remoteKey',
            'vendureNextKey.vendureNextKey': 'remoteNextKey.remoteNextKey',
          },
          remoteToVendure: {               // Map external DB columns to Vendure fields
            'remoteKey': 'vendureKey',
            'remoteNextKey.remoteNextKey': 'vendureNextKey.vendureNextKey',
          },
          batchSize: 50,                   // Optional: rows per batch (default: 50)
          scheduleCron: '0 */3 * * *',     // Optional: sync schedule (default: every 3 hours)
        },
        // Add more tables as needed (e.g., products)
      ],
    }),
    // ... other plugins
  ],
};
```

### Configuration Interface

```typescript
interface RemoteTableConfig {
  name: 'customers' | 'products';    // Name of the table to sync, add new tables as needed.
  vendureIdColumn: string;           // Primary key column in Vendure
  remoteIdColumn: string;            // Primary key column in external DB
  timestampColumn: string;           // Column for tracking changes (used for incremental sync)
  vendureToRemote: Record<string, string>;  // Field mapping: Vendure → External DB
  remoteToVendure: Record<string, string>;  // Field mapping: External DB → Vendure
  batchSize?: number;                // Optional: batch size (default: 50)
  scheduleCron?: string;             // Optional: cron schedule (default: '0 */3 * * *')
}
```

---

## 📊 Database Schema

The plugin creates the following database table:

### sync_table
- Stores synchronization metadata for each configured table
- Tracks the last successful sync timestamp
- Used to enable incremental syncs (only fetch records modified since last sync)

---

## 🏗️ Project Structure

```
src/plugins/external-sync/
├── external/                      # External database client
│   └── client.ts                 # MySQL connection pool manager
├── entities/                      # TypeORM entities
│   └── sync-table.ts             # Sync metadata entity
├── listener/                      # Event listeners
│   └── customer-event.listener.ts # Real-time sync listener for customer events
├── scheduler/                     # Scheduled tasks
│   └── sync-customer.ts          # Batch sync task
├── services/                      # Business logic services
│   └── sync-service.ts           # Core sync service with CRUD operations
├── utils/                         # Utility functions
│   └── mapping.ts                # Field mapping utilities
├── constants.ts                   # Plugin constants
├── types.ts                       # TypeScript type definitions
├── custom-fields.d.ts            # Custom field type definitions
└── external-sync.plugin.ts       # Main plugin definition
```

---

## 🔌 External Database Connection

The plugin uses a MySQL connection pool to connect to the external database. The connection is managed as a singleton instance and automatically initialized when the module starts.

**Connection Pool Settings:**
- Connection limit: 5
- Automatic connection management
- Graceful shutdown on module destroy

**Connection URL Format:**
```
mysql://username:password@host:port/database
```

---

## 📝 Field Mapping

The plugin uses bidirectional field mapping to translate between Vendure and external database schemas:

- **vendureToRemote**: Maps Vendure field names to external database column names (used for real-time sync)
- **remoteToVendure**: Maps external database column names to Vendure field names (used for scheduled sync)

**Example:**
```typescript
vendureToRemote: {
  'emailAddress': 'email',  // Vendure uses camelCase, external DB uses snake_case
  'firstName': 'first_name',
}

remoteToVendure: {
  'email': 'emailAddress',  // Reverse mapping
  'first_name': 'firstName',
}
```

**Special Mapping:**
- The external database ID is typically mapped to `mappingId` in Vendure (via custom field)
- This allows the plugin to identify corresponding records between systems

---

## 🎯 Key Features Explained

### Incremental Sync
- Uses `lastSyncedAt` timestamp to only sync records modified since last sync
- Significantly improves performance for large databases
- Can be reset by setting `lastSyncedAt` to `null` for full sync

### Batch Processing
- Processes records in configurable batches to avoid memory issues
- Default batch size is 50 records
- Can be customized per table configuration

### ID Mapping
- Maintains bidirectional mapping between Vendure and external database IDs
- Stores external database ID in `mappingId` custom field
- Enables efficient lookup and update operations

### Error Handling
- Errors are logged but don't interrupt the sync process
- Failed operations are logged with context for debugging
- Connection pool automatically handles connection failures

---

## 🚀 Installation

1. **Add the plugin to your Vendure configuration**:

```typescript
import { SyncPlugin } from './plugins/external-sync/external-sync.plugin';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    SyncPlugin.init({
      externalDbUrl: process.env.EXTERNAL_DB_URL!,
      tables: [
        // Configure your tables
      ],
    }),
    // ... other plugins
  ],
};
```

2. **Run database migrations**:
```bash
npm run migration:run
```

3. **Configure environment variables**:
```env
EXTERNAL_DB_URL=mysql://user:password@host:port/database
```

---

## ⚙️ Advanced Configuration

### Custom Sync Schedule

You can customize the sync schedule per table:

```typescript
{
  name: 'customers',
  // ... other config
  scheduleCron: '0 */1 * * *',  // Every hour
  // scheduleCron: '0 0 * * *',  // Daily at midnight
  // scheduleCron: '*/5 * * * * *',  // Every 5 seconds (for testing)
}
```

### Custom Batch Size

Adjust batch size based on your data volume:

```typescript
{
  name: 'customers',
  // ... other config
  batchSize: 100,  // Process 100 records per batch
}
```

### Disabling Scheduled Sync

To disable scheduled sync for a table, comment out the task registration in the plugin configuration or set a very long interval.

---

## 🔍 Troubleshooting

### Sync not working
- Check external database connection URL
- Verify field mappings match actual database schemas
- Check logs for error messages in the console

### Missing records after sync
- Verify `lastSyncedAt` is being updated correctly
- Check if timestamp column exists and is being updated in external database
- Consider resetting sync by setting `lastSyncedAt` to `null`

### Performance issues
- Reduce batch size for slower systems
- Adjust sync frequency (cron schedule)
- Monitor connection pool usage

---

## 📈 Next Steps

- Support for additional tables (products, orders, etc.) can be done by adding new tasks to the scheduler and listener.


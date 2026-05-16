# Query Runner Plugin

A Vendure plugin that provides a safe SQL query runner interface in the admin panel with permission-based access control.

## Features

- ✅ **Query Execution**: Supports SELECT, INSERT, UPDATE, DELETE, CREATE, SHOW, TRUNCATE and ALTER queries
- ✅ **Permission-Based Access**: Assign the `QueryRunner` permission to specific roles
- ✅ **Beautiful UI**: Clean, modern interface with syntax highlighting
- ✅ **Results Display**: Formatted table view with row count and execution time
- ✅ **Error Handling**: Clear error messages for failed queries
- ✅ **Metadata Display**: Shows affected rows, insert IDs, and other query metadata

## Security

The plugin enforces security measures:

- **Allowed query types**: SELECT, INSERT, UPDATE, DELETE, CREATE, SHOW, TRUNCATE, ALTER
- **Blocked operations**: DROP, EXEC, GRANT, REVOKE, and other highly destructive or privileged operations
- **Keyword filtering**: Dangerous SQL keywords are detected and blocked
- **Permission-based**: Only users with the `QueryRunner` permission can access the feature

## Installation

The plugin is already registered in `vendure-config.ts`. To use it:

1. **Assign Permission to Roles**:
   - Go to Settings → Roles & Permissions
   - Edit the role you want to grant access
   - Enable the `QueryRunner` permission
   - Save the role

2. **Access the Query Runner**:
   - Navigate to "Query Runner" in the admin sidebar
   - Enter your SELECT query
   - Click "Execute Query" to run it

## Usage

### Example Queries

```sql
-- SELECT: Get all customers
SELECT * FROM customer LIMIT 10;

-- SELECT: Get orders with customer information
SELECT o.id, o.code, c.firstName, c.lastName, o.totalWithTax
FROM `order` o
JOIN customer c ON o.customerId = c.id
ORDER BY o.createdAt DESC
LIMIT 20;

-- INSERT: Create a new record
INSERT INTO customer (firstName, lastName, emailAddress, phoneNumber)
VALUES ('John', 'Doe', 'john@example.com', '+1234567890');

-- UPDATE: Update existing records
UPDATE customer 
SET firstName = 'Jane' 
WHERE emailAddress = 'john@example.com';

-- DELETE: Delete records
DELETE FROM customer 
WHERE emailAddress = 'john@example.com';

-- CREATE: Create a new table
CREATE TABLE IF NOT EXISTS custom_log (
  id VARCHAR(36) PRIMARY KEY,
  message TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
src/plugins/query-runner/
├── api/                          # GraphQL API extensions
│   ├── api-extensions.ts        # GraphQL schema
│   └── query-runner.resolver.ts # GraphQL resolver
├── dashboard/                    # Admin UI components
│   ├── index.tsx                # Dashboard extension
│   └── routes/
│       ├── query-runner.tsx     # Main query runner page
│       ├── query-runner.graphql.ts
│       └── components/
│           ├── code-editor.tsx  # SQL editor component
│           └── query-results-table.tsx # Results table
├── services/
│   └── query-runner.service.ts  # Query execution logic
├── constants.ts                 # Plugin constants and permissions
└── query-runner.plugin.ts       # Main plugin definition
```

## Permissions

The plugin registers a single permission:

- **QueryRunner**: Allows access to the query runner interface

## GraphQL API

### Mutation

```graphql
mutation ExecuteQuery($query: String!) {
  executeQuery(query: $query) {
    columns
    rows
    rowCount
    executionTime
    error
  }
}
```

### Response Type

```typescript
type QueryResult {
  columns: [String!]!      # Column names
  rows: [JSON!]!           # Result rows as JSON
  rowCount: Int!          # Number of rows returned
  executionTime: Int!     # Execution time in milliseconds
  error: String           # Error message if query failed
}
```

## Development

To regenerate GraphQL types after schema changes:

```bash
npm run codegen
```

## Notes

- The plugin uses MySQL-specific query execution
- Results are limited to prevent memory issues (UI shows first 100 rows by default)
- All queries are logged for audit purposes
- The plugin respects Vendure's request context and channel isolation

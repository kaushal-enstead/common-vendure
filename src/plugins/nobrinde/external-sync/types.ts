export type TableName =
  | 'VENTIDADES' // customers
  | 'VVENDEDORES' // sale users
  | 'channels' // nobrinde channels
  | 'VENCOMENDAS' // orders
  | 'VENCOMENDAS_LINHAS' // order lines
  | 'VORCAMENTOS' // budgets
  | 'VORCAMENTOS_LINHAS' // budget lines
  | 'VTAGS' // facets
  | 'VTAG_VALUES' // facet values
  | 'VLABELS' // collections
  | 'VPRODUCTS'; // products
export interface RemoteTableConfig {
  name: TableName;
  // primary key column name in the vendure database
  vendureIdColumn: string;
  // primary key column name in the remote database
  remoteIdColumn: string;
  // timestamp column name for last sync
  timestampColumn?: string;
  // column mapping from vendure to remote
  vendureToRemote?: Record<string, string>;
  // column mapping from remote to vendure
  remoteToVendure?: Record<string, string>;
  // How many rows to sync in each batch. Default 50
  batchSize?: number;
  // How often to run scheduled sync, in cron format. Default: every 3 hours ("0 */3 * * *")
  scheduleCron?: string;
  // Extra table configuration for the table
  extraTable?: ExtraTableConfig;
  // Joins for the table
  joins?: JoinConfig[];
  extraSelect?: ExtraSelectConfig[];
}

export interface ExtraSelectConfig {
  table: TableName;
  fkColumn: string;
  alias: string;
  columns: string[];
}
export interface JoinConfig {
  table: TableName;
  on: string;
  type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
}

export interface ExtraTableConfig {
  name: string; // name of the extra table in vendure database
  vendureFkColumn: string; // foreign key column name in the vendure database
  fields: Record<string, string>; // field mapping from remote to vendure
}

export interface SyncResult {
  result: 'success' | 'error';
  totalRows: number;
  pageCount: number;
  insertedRows: number;
  upsertedRows?: number;
  updatedRows: number;
  failedRows: number;
  totalTime: number;
  partialRun?: boolean;
  error?: string;
  failedData?: { row: any; message: string }[];
  message?: string;
}

/**
 * @description
 * The plugin can be configured using the following options:
 */
export interface PluginInitOptions {
  externalDbUrl: string;
  provider: 'mysql' | 'postgresql' | 'mssql';
  tables: RemoteTableConfig[];
}

export interface ICustomer {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  title: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
}

export interface ExternalTable {
  customer: ICustomer;
  // product: IProduct;
}

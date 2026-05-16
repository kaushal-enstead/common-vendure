import { OnModuleInit, OnModuleDestroy, Injectable, Inject } from '@nestjs/common';
import { Logger } from '@vendure/core';
import { CUSTOMER_SYNC_PLUGIN_OPTIONS, DEFAULT_BATCH_SIZE, loggerCtx } from '../constants';
import { PluginInitOptions, RemoteTableConfig, TableName } from '../types';
import { ExternalDbClient } from '../external/client';
import { mapFields, mapFieldsFromMapping } from '../utils/mapping';

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private client: ExternalDbClient;
  private tConfig: RemoteTableConfig;
  placeHolders: Record<PluginInitOptions['provider'], string> = {
    mssql: '@p',
    postgresql: '$',
    mysql: '?',
  };

  constructor(@Inject(CUSTOMER_SYNC_PLUGIN_OPTIONS) private options: PluginInitOptions) {
    this.client = ExternalDbClient.getInstance(this.options.externalDbUrl, this.options.provider);
  }

  setConfig(tConfig: RemoteTableConfig) {
    if (!tConfig) {
      throw new Error('Remote table config not set as parameter');
    }
    this.tConfig = tConfig;
  }

  get tableConfig(): RemoteTableConfig {
    if (!this.tConfig) {
      throw new Error('Remote table config not set as property');
    }
    return this.tConfig;
  }

  async onModuleInit() {
    await this.client.init();
    Logger.debug('External database connection pool created', loggerCtx);
  }

  async onModuleDestroy() {
    await this.client.end();
    Logger.debug('External database connection pool closed', loggerCtx);
  }

  async checkConnection(): Promise<[boolean, string]> {
    return await this.client.checkConnection();
  }

  async getPlaceholder(provider: PluginInitOptions['provider'], index: number): Promise<string> {
    if (provider === 'mysql') return '?';
    if (provider === 'postgresql') return `$${index}`;
    if (provider === 'mssql') return `@p${index - 1}`;
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private buildExtraArrays(provider: string, mainTable: string) {
    const extraSelect = this.tableConfig.extraSelect ?? [];
    if (!extraSelect) {
      return [];
    }

    return extraSelect.map(extra => {
      const { table, fkColumn, alias, columns } = extra;

      if (provider === 'mssql') {
        return `(
          SELECT *
          FROM ${table} et
          WHERE et.${fkColumn} = ${mainTable}.id
          FOR JSON PATH
        ) AS ${alias}`;
      }

      if (provider === 'postgres') {
        return `(
          SELECT COALESCE(json_agg(et), '[]')
          FROM ${table} et
          WHERE et.${fkColumn} = ${mainTable}.id
        ) AS ${alias}`;
      }

      if (provider === 'mysql') {
        const jsonColumns = columns.map((c: string) => `'${c}', et.${c}`).join(',');

        return `(
          SELECT COALESCE(JSON_ARRAYAGG(
            JSON_OBJECT(${jsonColumns})
          ), JSON_ARRAY())
          FROM ${table} et
          WHERE et.${fkColumn} = ${mainTable}.id
        ) AS ${alias}`;
      }

      return '';
    });
  }

  async getRows<T>(
    page: number,
    lastSync?: Date | null,
  ): Promise<{ main: T; extra: Record<string, unknown>[] }> {
    //1. compute the limit and offset
    const { name, batchSize, timestampColumn } = this.tableConfig;
    const limit = batchSize || DEFAULT_BATCH_SIZE;
    const offset = (page - 1) * limit;

    //2. build the sql based on Provider
    let whereClause = '';
    let queryParams: any[] = [];
    const provider = this.options.provider;

    if (lastSync != null) {
      const placeholder = await this.getPlaceholder(provider, 1);
      whereClause = ` WHERE ${timestampColumn} >= ${placeholder}`;
      queryParams.push(lastSync.toISOString());
    }

    const joinClause = (this.tableConfig.joins ?? [])
      .map(j => `${j.type ?? 'INNER'} JOIN ${j.table} ON ${j.on}`)
      .join(' ');
    const extraSelects = this.buildExtraArrays(provider, name);

    let sql = '';
    if (provider === 'mssql') {
      // MSSQL Syntax (Requires ORDER BY)
      sql = `SELECT
              ${name}.* 
              ${extraSelects.length ? ',' + extraSelects.join(',') : ''}
              FROM ${name}${joinClause}${whereClause} 
              ORDER BY ${timestampColumn} ASC 
              OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    } else {
      // PostgreSQL and MySQL Syntax
      sql = `SELECT 
              ${name}.* 
              ${extraSelects.length ? ',' + extraSelects.join(',') : ''}
              FROM ${name}${joinClause}${whereClause} LIMIT ${limit} OFFSET ${offset}`;
    }
    //3. execute the select
    const rows = await this.client.query<Array<Record<string, unknown>>>(sql, queryParams);
    //4. map the rows to the vendure object
    const mappedRows = rows.map(row => mapFields(this.tableConfig, row, 'vendure'));
    let extraRows: Record<string, unknown>[] = [];
    if (this.tableConfig.extraTable?.fields) {
      extraRows = rows.map(row => mapFieldsFromMapping(this.tableConfig.extraTable?.fields ?? {}, row));
    }
    return { main: mappedRows as T, extra: extraRows };
  }

  /**
   * Fetches rows for the current {@link tableConfig} matching `columnName IN (values)`,
   * using the same JOINs and extra JSON selects as {@link getRows}, with parameterized placeholders.
   */
  async getMappedRowsWhereIn<T>(
    columnName: string,
    values: (string | number)[],
  ): Promise<{ main: T; extra: Record<string, unknown>[] }> {
    const unique = [...new Set(values.filter(v => v !== '' && v != null))] as (string | number)[];
    if (!unique.length) {
      return { main: [] as unknown as T, extra: [] };
    }

    const { name } = this.tableConfig;
    const provider = this.options.provider;
    const joinClause = (this.tableConfig.joins ?? [])
      .map(j => `${j.type ?? 'INNER'} JOIN ${j.table} ON ${j.on}`)
      .join(' ');
    const extraSelects = this.buildExtraArrays(provider, name);

    const placeholders: string[] = [];
    const queryParams: unknown[] = [];
    for (let i = 0; i < unique.length; i++) {
      placeholders.push(await this.getPlaceholder(provider, i + 1));
      queryParams.push(unique[i]);
    }
    const inList = placeholders.join(', ');

    let sql = '';
    if (provider === 'mssql') {
      sql = `SELECT
              ${name}.*
              ${extraSelects.length ? ',' + extraSelects.join(',') : ''}
              FROM ${name}${joinClause}
              WHERE ${columnName} IN (${inList})
              ORDER BY ${columnName} ASC`;
    } else {
      sql = `SELECT
              ${name}.*
              ${extraSelects.length ? ',' + extraSelects.join(',') : ''}
              FROM ${name}${joinClause}
              WHERE ${columnName} IN (${inList})`;
    }

    const rows = await this.client.query<Array<Record<string, unknown>>>(sql, queryParams);
    const mappedRows = rows.map(row => mapFields(this.tableConfig, row, 'vendure'));
    let extraRows: Record<string, unknown>[] = [];
    if (this.tableConfig.extraTable?.fields) {
      extraRows = rows.map(row => mapFieldsFromMapping(this.tableConfig.extraTable?.fields ?? {}, row));
    }
    return { main: mappedRows as T, extra: extraRows };
  }

  /** Convenience: `WHERE remoteIdColumn IN (...)` for the active table config. */
  async getMappedRowsByRemoteIds<T>(
    remoteIds: (string | number)[],
  ): Promise<{ main: T; extra: Record<string, unknown>[] }> {
    return this.getMappedRowsWhereIn<T>(this.tableConfig.remoteIdColumn, remoteIds);
  }

  async getRowsWithoutTimestamp<T>(page: number): Promise<{ main: T; extra: Record<string, unknown>[] }> {
    //1. compute the limit and offset
    const { name, batchSize, remoteIdColumn } = this.tableConfig;
    const limit = batchSize || DEFAULT_BATCH_SIZE;
    const offset = (page - 1) * limit;

    //2. build the sql
    let whereClause = '';
    let queryParams: any[] = [];
    let sql = '';
    if (this.options.provider === 'mssql') {
      /**
       * MSSQL requires an ORDER BY clause to use OFFSET/FETCH.
       * If you don't have a specific column, (SELECT NULL) is a common trick.
       */
      sql = `SELECT * FROM ${name}${whereClause} 
             ORDER BY ${remoteIdColumn} 
             OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    } else {
      // MySQL and PostgreSQL
      sql = `SELECT * FROM ${name}${whereClause} LIMIT ${limit} OFFSET ${offset}`;
    }

    //3. execute the select
    const rows = await this.client.query<Array<Record<string, unknown>>>(sql, queryParams);
    //4. map the rows to the vendure object
    if (!this.tableConfig.remoteToVendure || !this.tableConfig.vendureToRemote) {
      return { main: rows as T, extra: [] };
    }
    const mappedRows = rows.map(row => mapFields(this.tableConfig, row, 'vendure'));
    let extraRows: Record<string, unknown>[] = [];
    if (this.tableConfig.extraTable?.fields) {
      extraRows = rows.map(row => mapFieldsFromMapping(this.tableConfig.extraTable?.fields ?? {}, row));
    }
    return { main: mappedRows as T, extra: extraRows };
  }

  async getRowsFromTable<T>(
    tableName: TableName,
    idColumn: string,
    page: number,
    timestampColumn: string,
    lastSync?: Date | null,
  ): Promise<T[]> {
    //1. compute the limit and offset
    const limit = DEFAULT_BATCH_SIZE;
    const offset = (page - 1) * limit;
    const provider = this.options.provider;

    //2. build the sql
    let whereClause = '';
    let queryParams: any[] = [];
    let sql = '';

    if (lastSync != null) {
      const placeholder = await this.getPlaceholder(provider, 1);
      whereClause = ` WHERE ${timestampColumn} >= ${placeholder}`;
      queryParams.push(lastSync.toISOString());
    }

    if (this.options.provider === 'mssql') {
      /**
       * MSSQL requires an ORDER BY clause to use OFFSET/FETCH.
       * If you don't have a specific column, (SELECT NULL) is a common trick.
       */
      sql = `SELECT * FROM ${tableName}${whereClause} 
             ORDER BY ${idColumn} 
             OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    } else {
      // MySQL and PostgreSQL
      sql = `SELECT * FROM ${tableName}${whereClause} LIMIT ${limit} OFFSET ${offset}`;
    }

    //3. execute the select
    const rows = await this.client.query<Array<Record<string, unknown>>>(sql, queryParams);
    return rows as T[];
  }

  async getRowsFromTableByCol<T>(
    tableName: string,
    columnName: string,
    columnValue: string | number,
  ): Promise<T[]> {
    const sql = `SELECT * FROM ${tableName} WHERE ${columnName} = ${columnValue}`;
    const rows = await this.client.query<T[]>(sql);
    return rows as T[];
  }

  async executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    const rows = await this.client.query<T[]>(sql, params);
    return rows as T[];
  }

  async create(input: Record<string, any>, needMapping: boolean = true): Promise<{ insertId: number }> {
    try {
      //1. map the input to the remote object
      const remoteObject = needMapping ? mapFields(this.tableConfig, input, 'remote') : input;

      //2. remove the id column from the remote object
      delete remoteObject[this.tableConfig.vendureIdColumn];

      //3. Generate column names and values from the remote object
      const remoteColumns = Object.keys(remoteObject);
      const remoteValues = remoteColumns.map(col => remoteObject[col]);

      //4. Build SQL for insert
      const placeholders = remoteColumns
        .map((_, i) => {
          return this.getPlaceholder(this.options.provider, i + 1);
        })
        .join(', ');
      const sql = `INSERT INTO ${this.tableConfig.name} (${remoteColumns.join(', ')}) VALUES (${placeholders})`;

      Logger.debug(
        'SyncService create sql: ' + sql + ' values: ' + JSON.stringify(remoteValues, null, 2),
        loggerCtx,
      );
      //4. Execute the insert
      const result = await this.client.query(sql, remoteValues);

      //5. return the remote object
      return result;
    } catch (err) {
      Logger.error('SyncService create failed: ' + err, loggerCtx);
      throw err;
    }
  }

  async update(id: number, input: Record<string, any>): Promise<void> {
    try {
      if (!id) {
        throw new Error('Missing ID for update operation');
      }
      const { remoteIdColumn, name } = this.tableConfig;
      //1. map the input to the remote object
      const remoteObject = mapFields(this.tableConfig, input, 'remote');

      //2. build the update columns and values
      const updateColumns: string[] = [];
      const updateValues: unknown[] = [];
      for (const [remoteKey, remoteValue] of Object.entries(remoteObject)) {
        if (remoteKey !== remoteIdColumn) {
          updateColumns.push(`${remoteKey} = ?`);
          updateValues.push(remoteValue);
        }
      }

      // Optionally update a timestamp column if configured
      // if (timestampColumn) {
      //   updateColumns.push(`${timestampColumn} = NOW()`);
      // }

      //3. check if there are any columns to update
      if (updateColumns.length === 0) {
        // Nothing to update, just return
        return;
      }

      //4. build the sql and execute the update
      const placeholder = await this.getPlaceholder(this.options.provider, 1);
      const sql = `UPDATE ${name} SET ${updateColumns.join(', ')} WHERE ${remoteIdColumn} = ${placeholder}`;
      updateValues.push(id);

      await this.client.query(sql, updateValues);
    } catch (err) {
      Logger.error('SyncService update failed: ' + err, loggerCtx);
      throw err;
    }
  }

  async delete(id: number): Promise<void> {
    if (!id) {
      throw new Error('Missing ID for delete operation');
    }
    const { name, remoteIdColumn } = this.tableConfig;
    const placeholder = await this.getPlaceholder(this.options.provider, 1);
    const sql = `DELETE FROM ${name} WHERE ${remoteIdColumn} = ${placeholder}`;
    await this.client.query(sql, [id]);
  }
}

import mysql, { PoolOptions } from 'mysql2/promise';
import pg from 'pg';
import mssql from 'mssql';
import { PluginInitOptions } from '../types';

interface ExecutionResult {
  affectedRows: number;
  insertId?: number | string;
}

export class ExternalDbClient {
  private pool: mysql.Pool | pg.Pool | mssql.ConnectionPool;
  private isInitialized: boolean = false;
  private static _instance: ExternalDbClient;

  constructor(
    private connectionUrl: string,
    private provider: PluginInitOptions['provider'],
  ) {
    this.init();
  }

  static getInstance(connectionUrl: string, provider: PluginInitOptions['provider']): ExternalDbClient {
    if (!this._instance) {
      this._instance = new ExternalDbClient(connectionUrl, provider);
    }
    return this._instance;
  }

  init(): void {
    if (this.isInitialized) {
      return;
    }
    if (!this.connectionUrl) {
      return;
    }
    if (!this.provider) {
      return;
    }
    if (this.provider === 'mysql') {
      this.pool = mysql.createPool({
        uri: this.connectionUrl,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      });
    }
    if (this.provider === 'postgresql') {
      this.pool = new pg.Pool({
        connectionString: this.connectionUrl,
        max: 5,
      });
    }
    if (this.provider === 'mssql') {
      const { host, port, user, password, database } = this.parseDBUrl(this.connectionUrl);
      // this.pool = new mssql.ConnectionPool(this.connectionUrl);
      const config: mssql.config = {
        user,
        password,
        server: host as string, // This is the "config.server" it was missing
        port: (port as number) || 1433,
        database: database as string,
        options: {
          encrypt: true, // Required for Azure and many modern setups
          trustServerCertificate: true, // Change to false in production with valid SSL
        },
        pool: {
          max: 5,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };

      this.pool = new mssql.ConnectionPool(config);
    }
    this.isInitialized = true;
  }

  async queryDb<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // 1. MySQL Implementation
    if (this.provider === 'mysql') {
      // MySQL returns [rows, fields]
      const [rows] = await (this.pool as mysql.Pool).execute(sql, params);
      return rows as T[];
    }

    // 2. PostgreSQL Implementation
    if (this.provider === 'postgresql') {
      // PG returns a Result object; data is in .rows
      const res = await (this.pool as pg.Pool).query(sql, params);
      return res.rows as T[];
    }

    // 3. MSSQL Implementation
    if (this.provider === 'mssql') {
      const pool = this.pool as mssql.ConnectionPool;
      // Ensure the pool is connected (MSSQL requirement)
      if (!pool.connected) await pool.connect();

      const request = pool.request();

      // MSSQL doesn't use '?' placeholders by default.
      // This assumes your SQL uses @p0, @p1, etc.
      params.forEach((val, index) => {
        request.input(`p${index}`, val);
      });

      const result = await request.query(sql);
      return result.recordset as T[];
    }

    throw new Error(`Unsupported provider: ${this.provider}`);
  }

  async executeDb(sql: string, params: any[] = []): Promise<ExecutionResult> {
    // 1. MySQL Implementation
    if (this.provider === 'mysql') {
      const [result] = await (this.pool as mysql.Pool).execute(sql, params);
      // MySQL returns a ResultSetHeader for non-select queries
      return {
        affectedRows: (result as mysql.ResultSetHeader).affectedRows,
        insertId: (result as mysql.ResultSetHeader).insertId,
      };
    }

    // 2. PostgreSQL Implementation
    if (this.provider === 'postgresql') {
      const res = await (this.pool as pg.Pool).query(sql, params);
      // PG returns rowCount for affected rows
      return {
        affectedRows: res.rowCount || 0,
      };
    }

    // 3. MSSQL Implementation
    if (this.provider === 'mssql') {
      const pool = this.pool as mssql.ConnectionPool;
      if (!pool.connected) await pool.connect();

      const request = pool.request();
      params.forEach((val, index) => {
        request.input(`p${index}`, val);
      });

      const result = await request.query(sql);
      // MSSQL returns rowsAffected as an array (since one query can have multiple statements)
      return {
        affectedRows: result.rowsAffected[0] || 0,
      };
    }

    throw new Error(`Unsupported provider: ${this.provider}`);
  }

  async endPool(): Promise<void> {
    if (this.provider === 'mysql') {
      await (this.pool as mysql.Pool).end();
    }
    if (this.provider === 'postgresql') {
      await (this.pool as pg.Pool).end();
    }
    if (this.provider === 'mssql') {
      await (this.pool as mssql.ConnectionPool).close();
    }
  }

  async checkConnection(): Promise<[boolean, string]> {
    try {
      if (!this.connectionUrl) {
        return [false, 'External database URL is not set'];
      }
      if (!this.provider) {
        return [false, 'External database provider is not set'];
      }
      await this.queryDb('SELECT 1');
      return [true, 'Connection to external database established'];
    } catch (error) {
      if (error instanceof Error) {
        return [false, error.message];
      }
      return [false, 'Unknown error checking connection to external database'];
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    const rows = await this.queryDb<T[]>(sql, params);
    return rows as T;
  }

  async execute<T = any>(sql: string, params: any[] = []): Promise<T> {
    const res = await this.executeDb(sql, params);
    return {
      affectedRows: res.affectedRows,
      insertId: res.insertId,
    } as T;
  }

  async end(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.endPool();
    this.isInitialized = false;
  }

  // private parseDBUrl(url: string): PoolOptions {
  //   // Support standard mysql URL: mysql://user:pass@host:port/db
  //   console.log('url', url);
  //   const cleanUrl = url.trim();
  //   const u = new URL(cleanUrl);
  //   const user = decodeURIComponent(u.username);
  //   const password = decodeURIComponent(u.password);
  //   const host = u.hostname;
  //   const port = u.port ? parseInt(u.port, 10) : 3306;
  //   const database = u.pathname.replace(/^\//, '');
  //   return { host, port, user, password, database } as PoolOptions;
  // }

  private parseDBUrl(url: string) {
    // This Regex captures: protocol, user, pass, host, port, and database
    const regex = /^(.*):\/\/(.*):(.*)@(.*):(\d+)\/(.*)$/;
    const match = url.split('?')[0].match(regex);

    if (!match) {
      throw new Error('Could not parse connection URL. Ensure format is protocol://user:pass@host:port/db');
    }

    const [, protocol, user, password, host, port, database] = match;

    // Extract query params manually for MSSQL options
    const params = new URLSearchParams(url.split('?')[1] || '');

    return {
      user: decodeURIComponent(user),
      password: decodeURIComponent(password), // Handles the dots and commas
      server: host,
      host: host,
      port: parseInt(port, 10),
      database: database,
      options: Object.fromEntries(params),
    };
  }
}

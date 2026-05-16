import { Logger } from '@vendure/core';
import { Injectable } from '@nestjs/common';
import { TransactionalConnection, RequestContext } from '@vendure/core';
import { loggerCtx } from '../constants';
import { QueryResult } from '../gql/generated';

@Injectable()
export class QueryRunnerService {
  constructor(private connection: TransactionalConnection) {}

  private splitSqlStatements(query: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      const next = query[i + 1];
      const prev = query[i - 1];

      if (inLineComment) {
        current += char;
        if (char === '\n') {
          inLineComment = false;
        }
        continue;
      }

      if (inBlockComment) {
        current += char;
        if (prev === '*' && char === '/') {
          inBlockComment = false;
        }
        continue;
      }

      if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (char === '-' && next === '-') {
          inLineComment = true;
          current += char;
          continue;
        }
        if (char === '/' && next === '*') {
          inBlockComment = true;
          current += char;
          continue;
        }
      }

      if (char === "'" && !inDoubleQuote && !inBacktick && prev !== '\\') {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote && !inBacktick && prev !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
      }

      if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
        const statement = current.trim();
        if (statement.length > 0) {
          statements.push(statement);
        }
        current = '';
        continue;
      }

      current += char;
    }

    const trailing = current.trim();
    if (trailing.length > 0) {
      statements.push(trailing);
    }

    return statements;
  }

  /**
   * Execute a SQL query safely.
   *
   * - Allows: SELECT, INSERT, UPDATE, DELETE, CREATE, SHOW, TRUNCATE, ALTER
   * - Blocks: DROP, EXEC/EXECUTE/CALL, GRANT/REVOKE, FLUSH
   *
   * Behaviour:
   * - CREATE → keep returning a small metadata object (affectedRows, insertId, ...)
   * - Everything else (SELECT, SHOW, INSERT, UPDATE, DELETE, TRUNCATE, ALTER, ...) →
   *   return the raw DB driver result as JSON in a single `json` column.
   */
  async executeQuery(ctx: RequestContext, query: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const statements = this.splitSqlStatements(query);
      if (statements.length === 0) {
        throw new Error('No SQL statement found');
      }

      const allowedPrefixes = [
        'SET',
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'CREATE',
        'SHOW',
        'TRUNCATE',
        'ALTER',
        'DROP',
      ];

      // Check for dangerous SQL keywords that could cause data loss or security issues
      const dangerousKeywords = ['EXEC', 'EXECUTE', 'CALL', 'GRANT', 'REVOKE', 'FLUSH'];

      for (const statement of statements) {
        const upperQuery = statement.toUpperCase().trim();
        const startsWithAllowed = allowedPrefixes.some(prefix => upperQuery.startsWith(prefix));

        if (!startsWithAllowed) {
          throw new Error(`Query must start with one of: ${allowedPrefixes.join(', ')}`);
        }

        for (const keyword of dangerousKeywords) {
          const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
          if (keywordRegex.test(statement)) {
            throw new Error(`Query contains forbidden keyword: ${keyword}`);
          }
        }
      }

      const statementResults: Array<{ statement: string; result: any }> = [];
      let lastRawResult: any = null;
      let lastUpperQuery = '';
      for (const statement of statements) {
        lastUpperQuery = statement.toUpperCase().trim();
        lastRawResult = await this.connection.rawConnection.query(statement);
        statementResults.push({ statement, result: lastRawResult });
      }

      const executionTime = Date.now() - startTime;

      const isCreate = statements.length === 1 && lastUpperQuery.startsWith('CREATE');

      // For CREATE, keep a compact metadata-style response
      if (isCreate) {
        const result = Array.isArray(lastRawResult) ? lastRawResult[0] : lastRawResult;

        let columns: string[] = [];
        let rows: any[] = [];
        let rowCount = 0;

        if (result && typeof result === 'object') {
          const metadata: any = {};

          if ('affectedRows' in result) {
            metadata.affectedRows = (result as any).affectedRows;
            rowCount = (result as any).affectedRows || 0;
          }
          if ('insertId' in result && (result as any).insertId) {
            metadata.insertId = (result as any).insertId;
          }
          if ('changedRows' in result) {
            metadata.changedRows = (result as any).changedRows;
          }
          if ('warningCount' in result) {
            metadata.warningCount = (result as any).warningCount;
          }

          columns = Object.keys(metadata);
          rows = columns.length ? [metadata] : [{ status: 'Query executed successfully' }];
          if (!rowCount) {
            rowCount = rows.length;
          }
        } else {
          columns = ['status'];
          rows = [{ status: 'Query executed successfully' }];
          rowCount = 1;
        }

        Logger.info(`Query executed successfully in ${executionTime}ms`, loggerCtx);

        return {
          columns,
          rows,
          rowCount,
          executionTime,
        };
      }

      // if (isSelect) {
      //   let columns: string[] = [];
      //   let rows: any[] = [];
      //   let rowCount = 0;

      //   if (Array.isArray(rawResults)) {
      //     // MySQL driver: [rows, fields]
      //     const firstResult = rawResults[0];

      //     if (Array.isArray(firstResult)) {
      //       rows = firstResult;
      //       if (rows.length > 0) {
      //         columns = Object.keys(rows[0]);
      //       }
      //       rowCount = rows.length;
      //     } else if (firstResult && typeof firstResult === 'object') {
      //       rows = [firstResult];
      //       columns = Object.keys(firstResult);
      //       rowCount = 1;
      //     }
      //   } else if (rawResults && typeof rawResults === 'object') {
      //     if (Array.isArray(rawResults)) {
      //       rows = rawResults;
      //       if (rows.length > 0) {
      //         columns = Object.keys(rows[0]);
      //       }
      //       rowCount = rows.length;
      //     } else {
      //       rows = [rawResults];
      //       columns = Object.keys(rawResults);
      //       rowCount = 1;
      //     }
      //   }

      //   return {
      //     columns,
      //     rows,
      //     rowCount,
      //     executionTime,
      //   };
      // }

      Logger.info(`Query executed successfully in ${executionTime}ms`, loggerCtx);

      return {
        columns: ['json'],
        rows: [{ json: statements.length === 1 ? lastRawResult : statementResults }],
        rowCount: statements.length,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      Logger.error(`Query execution failed: ${error.message}`, loggerCtx);

      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime,
        error: error.message || 'Unknown error occurred',
      };
    }
  }
}

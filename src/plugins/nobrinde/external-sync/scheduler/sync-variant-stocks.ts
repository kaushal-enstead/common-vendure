import { ScheduledTask, StockMovementService, TransactionalConnection } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import {
  applyVstocksDataRows,
  VstocksDataRow,
  vstocksCursorKey,
} from './product/variant/upsert-variant-stocks';

const PAGE_SIZE = 2000;

const keyExpr = `CAST(LTRIM(RTRIM(CAST(st.sku_variant AS NVARCHAR(512)))) AS NVARCHAR(512))`;

/**
 * Syncs on-hand stock from `VSTOCKS_DATA` only (no joins). Paginates by `sku_variant`; each row
 * updates the `ProductVariant` whose `sku` equals that value.
 */
export const syncVariantStocksTask = new ScheduledTask({
  id: 'sync-variant-stocks-task',
  description: 'Sync variant stock levels from VSTOCKS_DATA (by sku_variant → ProductVariant.sku)',
  schedule: cron => cron.everySundayAt(12),
  async execute({ injector, params, scheduledContext: ctx }) {
    const timeStart = Date.now();
    const resultObject: SyncResult = {
      result: 'success',
      totalRows: 0,
      totalTime: 0,
      upsertedRows: 0,
      insertedRows: 0,
      updatedRows: 0,
      partialRun: false,
      pageCount: 1,
      failedRows: 0,
      failedData: [],
    };
    console.time('syncVariantStocksTask');
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);
      const repo = connection.getRepository(ctx, SyncTable);
      syncService.setConfig(params.tableConfig);

      const stockMovementService = injector.get(StockMovementService);

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const stockQuery = `
      SELECT TOP ${PAGE_SIZE}
          st.sku_variant AS sku_variant,
          st.has_stock AS has_stock,
          st.stocks AS stocks,
          st.next_stocks_1 AS next_stocks_1,
          st.next_date_1   AS next_date_1,
          st.next_stocks_2 AS next_stocks_2,
          st.next_date_2   AS next_date_2,
          st.next_stocks_3 AS next_stocks_3,
          st.next_date_3   AS next_date_3
      FROM VSTOCKS_DATA st
      WHERE (${keyExpr} <> N'')
        AND (@p0 IS NULL OR ${keyExpr} > CAST(@p0 AS NVARCHAR(512)))
      ORDER BY ${keyExpr}
    `;

      let page = 1;
      let hasNext = true;
      let lastCursor: string | null = null;

      while (hasNext) {
        const queryParams = [lastCursor] as (string | null)[];
        const rows = await syncService.executeQuery<VstocksDataRow>(stockQuery, queryParams);
        if (!rows || rows.length === 0) {
          hasNext = false;
          if (page === 1) {
            resultObject.message = 'No rows found in DB to sync';
            return resultObject;
          }
          break;
        }

        resultObject.totalRows += rows.length;
        const { appliedVariants, skippedKeys } = await applyVstocksDataRows(
          ctx,
          connection,
          stockMovementService,
          rows,
        );
        resultObject.upsertedRows = (resultObject.upsertedRows ?? 0) + appliedVariants;
        if (skippedKeys > 0) {
          console.warn(
            `syncVariantStocksTask page ${page}: ${skippedKeys} sku_variant(s) had no matching ProductVariant`,
          );
        }

        resultObject.pageCount = page;
        resultObject.partialRun = true;

        const last = rows[rows.length - 1];
        lastCursor = vstocksCursorKey(last) || null;

        hasNext = rows.length === PAGE_SIZE;
        page++;
      }

      const lastSyncedAt = new Date();
      await repo
        .createQueryBuilder()
        .insert()
        .into(SyncTable)
        .values({ tableName, lastSyncedAt })
        .orUpdate(['lastSyncedAt'])
        .execute();

      return resultObject;
    } catch (error) {
      console.error('syncVariantStocksTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      resultObject.totalTime = (Date.now() - timeStart) / 1000;
      console.timeEnd('syncVariantStocksTask');
      return resultObject;
    }
  },
});

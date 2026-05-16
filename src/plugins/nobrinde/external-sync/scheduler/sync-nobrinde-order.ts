import { ScheduledTask, TransactionalConnection } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import { DEFAULT_BATCH_SIZE } from '../constants';
import {
  applyNobrindeOrderRowsFromRemote,
  fetchNobrindeOrderPage,
} from './nobrinde-order-sync-utils';

/**
 * Full sync: set SyncTable.lastSyncedAt to null for `nobrinde_orders` (see task params `tableName`).
 */
export const syncNobrindeOrderTask = new ScheduledTask({
  id: 'sync-nobrinde-order-task',
  description: 'Sync nobrinde orders and order lines from external database to vendure database',
  schedule: cron => cron.everyDayAt(0),
  async execute({ injector, params, scheduledContext: ctx }) {
    const timeStart = Date.now();
    const resultObject: SyncResult = {
      result: 'success',
      totalRows: 0,
      totalTime: 0,
      insertedRows: 0,
      updatedRows: 0,
      failedRows: 0,
      failedData: [],
      partialRun: false,
      pageCount: 1,
    };
    console.time('syncNobrindeOrderTask');
    try {
      const { tableName, tableConfig } = params as {
        tableName: string;
        tableConfig: RemoteTableConfig;
      };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);
      const repo = connection.getRepository(ctx, SyncTable);

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      syncService.setConfig(tableConfig);
      const syncConfig = await repo.findOne({ where: { tableName } });
      const lastSyncedAt = syncConfig?.lastSyncedAt ?? null;

      let offset = 0;
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const rows = await fetchNobrindeOrderPage(syncService, tableConfig, lastSyncedAt, offset);
        if (!rows.length) {
          hasNext = false;
          if (page === 1) {
            resultObject.message = 'No rows found in DB to sync';
          }
          break;
        }

        resultObject.totalRows += rows.length;
        await applyNobrindeOrderRowsFromRemote(connection, rows, resultObject);

        offset += rows.length;
        resultObject.pageCount = page;
        resultObject.partialRun = true;
        page++;

        const batchSize = tableConfig.batchSize ?? DEFAULT_BATCH_SIZE;
        hasNext = rows.length === batchSize;
      }

      const lastSyncedAtNew = new Date();
      await repo
        .createQueryBuilder()
        .insert()
        .into(SyncTable)
        .values({ tableName, lastSyncedAt: lastSyncedAtNew })
        .orUpdate(['lastSyncedAt'])
        .execute();

      return resultObject;
    } catch (error) {
      console.error('syncNobrindeOrderTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      resultObject.totalTime = (timeEnd - timeStart) / 1000;
      console.timeEnd('syncNobrindeOrderTask');
      return resultObject;
    }
  },
});

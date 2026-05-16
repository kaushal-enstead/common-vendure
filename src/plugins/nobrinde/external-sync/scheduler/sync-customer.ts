import { Customer, CustomerService, ScheduledTask, TransactionalConnection } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import { applyCustomerExternalRows, getEnglishRegionTranslations } from './sync-customer-utils';

/**
 * IF you want to full sync the table, you can set lastSyncedAt to null.
 */
export const syncCustomerTask = new ScheduledTask({
  id: 'sync-customer-task',
  description: 'Sync customer from external database to vendure database',
  schedule: cron => cron.everyDayAt(5), // fallback to every minute
  // schedule: '*/5 * * * * *', // every 5 seconds
  async execute({ injector, params, scheduledContext: ctx }) {
    console.time('syncCustomerTask');
    const timeStart = Date.now();
    const resultObject: SyncResult = {
      result: 'success',
      totalRows: 0,
      totalTime: 0,
      insertedRows: 0,
      updatedRows: 0,
      partialRun: false,
      pageCount: 1,
      failedRows: 0,
      failedData: [],
    };
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const customerService = injector.get(CustomerService);
      const connection = injector.get(TransactionalConnection);
      const repo = connection.getRepository(ctx, SyncTable);
      const syncConfig = await repo.findOne({ where: { tableName } });
      const regions = await getEnglishRegionTranslations(connection);
      syncService.setConfig(params.tableConfig);

      // verify connection
      const isConnected = await syncService.checkConnection();
      if (!isConnected) {
        return { result: 'error', totalRows: 0, error: 'Failed to connect to external database' };
      }

      // const insertRows: Partial<Customer>[] = [];
      // const updateRows = [];
      let hasNext = true;

      while (hasNext) {
        const { main: rows, extra: extraRows } = await syncService.getRows<Customer[]>(
          resultObject.pageCount,
          syncConfig?.lastSyncedAt,
        );
        if (!rows || rows?.length === 0) {
          hasNext = false;
          break;
        }
        resultObject.totalRows += rows.length;

        await applyCustomerExternalRows(
          ctx,
          connection,
          customerService,
          syncService,
          regions,
          rows,
          extraRows,
          resultObject,
        );
        resultObject.pageCount++;
      }

      const lastSyncedAt = new Date();
      // Use upsert-like operation with query builder; not all DBs support true upsert with QueryBuilder, but for Postgres and MySQL you can use "ON DUPLICATE KEY UPDATE"/"ON CONFLICT":
      await repo
        .createQueryBuilder()
        .insert()
        .into(SyncTable)
        .values({ tableName, lastSyncedAt })
        .orUpdate(['lastSyncedAt'])
        .execute();

      return resultObject;
    } catch (error) {
      console.error('Error in syncCustomerTask', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      const totalTime = timeEnd - timeStart;
      resultObject.totalTime = totalTime / 1000;
      console.timeEnd('syncCustomerTask');
      return resultObject;
    }
  },
});

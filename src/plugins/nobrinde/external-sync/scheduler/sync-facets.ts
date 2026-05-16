import { ChannelService, ScheduledTask, TransactionalConnection } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import {
  TagRow,
  TagValueRow,
  upsertFacetsFromRows,
  upsertFacetValuesFromRows,
} from './facet/sync-facet-utils';

/**
 * IF you want to full sync the table, you can set lastSyncedAt to null.
 */
export const syncFacetsTask = new ScheduledTask({
  id: 'sync-facets-task',
  description: 'Sync facets from external database to vendure database',
  schedule: cron => cron.everyDayAt(4), // fallback to every minute
  // schedule: '*/5 * * * * *', // every 5 seconds
  async execute({ injector, params, scheduledContext: ctx }) {
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
    console.time('syncFacetsTask');
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);

      const repo = connection.getRepository(ctx, SyncTable);
      const syncConfig = await repo.findOne({ where: { tableName } });
      syncService.setConfig(params.tableConfig);
      const channelService = injector.get(ChannelService);
      const defaultChannel = await channelService.getDefaultChannel();
      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const syncFacetsOnly = async () => {
        let hasNext = true;
        // sync facets (tags + embedded tag values)
        while (hasNext) {
          const { main: rows } = await syncService.getRows<TagRow[]>(
            resultObject.pageCount,
            syncConfig?.lastSyncedAt,
          );
          if (!rows || rows?.length === 0) {
            hasNext = false;
            break;
          }
          resultObject.totalRows += rows.length;
          const updatedCount = await upsertFacetsFromRows(connection, defaultChannel, rows);
          resultObject.updatedRows += updatedCount;

          resultObject.pageCount++;
          resultObject.partialRun = true;
        }
      };

      const syncFacetValuesOnly = async () => {
        // sync standalone tag values from VTAG_VALUES, using lastSyncedAt for incremental sync
        let hasNextTagValues = true;
        let tagValuesPage = 1;
        while (hasNextTagValues) {
          const tagValueRows = await syncService.getRowsFromTable<TagValueRow>(
            'VTAG_VALUES',
            'id',
            tagValuesPage,
            'date_updated',
            syncConfig?.lastSyncedAt,
          );

          if (!tagValueRows || tagValueRows.length === 0) {
            hasNextTagValues = false;
            break;
          }

          resultObject.totalRows += tagValueRows.length;
          const updatedCount = await upsertFacetValuesFromRows(connection, defaultChannel, tagValueRows);
          resultObject.updatedRows += updatedCount;

          tagValuesPage++;
          resultObject.partialRun = true;
        }
      };

      await syncFacetsOnly();
      await syncFacetValuesOnly();

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
      console.error('syncFacetsTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      const totalTime = timeEnd - timeStart;
      resultObject.totalTime = totalTime / 1000;
      console.timeEnd('syncFacetsTask');
      return resultObject;
    }
  },
});

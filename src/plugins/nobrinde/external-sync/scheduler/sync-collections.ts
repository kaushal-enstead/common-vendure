import {
  ScheduledTask,
  TransactionalConnection,
  ChannelService,
  CollectionService,
  LanguageCode,
} from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import {
  buildCollectionsQuery,
  CollectionRow,
  getRootCollection,
  upsertCollectionsFromRows,
} from './collection/sync-collection-utils';
import { upsertAssets } from './product/upsert-asset';
import { LanguageRow } from './product/types';
/**
 * IF you want to full sync the table, you can set lastSyncedAt to null.
 */
export const syncCollectionsTask = new ScheduledTask({
  id: 'sync-collections-task',
  description: 'Sync collections from external database to vendure database',
  schedule: cron => cron.everyDayAt(6), // fallback to every minute
  // schedule: '*/5 * * * * *', // every 5 seconds
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
    console.time('syncCollectionsTask');
    try {
      const languageCodes: (keyof LanguageRow)[] = [LanguageCode.pt, LanguageCode.en];

      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);
      const collectionService = injector.get(CollectionService);
      const repo = connection.getRepository(ctx, SyncTable);
      syncService.setConfig(params.tableConfig);
      const channelService = injector.get(ChannelService);
      const defaultChannel = await channelService.getDefaultChannel();
      const rootCollection = await getRootCollection(ctx, connection, defaultChannel);
      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const rows = await syncService.executeQuery<CollectionRow>(buildCollectionsQuery());
      if (!rows || rows?.length === 0) {
        resultObject.message = 'No rows found in DB to sync';
        return resultObject;
      }
      resultObject.totalRows += rows.length;
      const upsertedCount = await upsertCollectionsFromRows(
        connection,
        defaultChannel,
        rows,
        rootCollection.id,
      );
      if (upsertedCount > 0) {
        resultObject.upsertedRows = (resultObject.upsertedRows ?? 0) + upsertedCount;
      }

      await upsertAssets(
        connection,
        defaultChannel,
        rows,
        'collection',
        rows.map(row => String(row.category_id)),
        languageCodes,
      );

      resultObject.pageCount++;
      resultObject.partialRun = true;

      const lastSyncedAt = new Date();
      await collectionService.triggerApplyFiltersJob(ctx, {
        collectionIds: [],
        applyToChangedVariantsOnly: false,
      });
      await repo
        .createQueryBuilder()
        .insert()
        .into(SyncTable)
        .values({ tableName, lastSyncedAt })
        .orUpdate(['lastSyncedAt'])
        .execute();

      return resultObject;
    } catch (error) {
      console.error('syncCollectionsTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      const totalTime = timeEnd - timeStart;
      resultObject.totalTime = totalTime / 1000;
      console.timeEnd('syncCollectionsTask');
      return resultObject;
    }
  },
});

import { ScheduledTask, TransactionalConnection } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import { NobrindeChannel } from '../../nobrinde-entity/entities/nobrinde-channels';

/**
 * Full sync: set lastSyncedAt to null for the table to re-fetch all rows.
 */
export const syncNobrindeChannelsTask = new ScheduledTask({
  id: 'sync-nobrinde-channels-task',
  description: 'Sync nobrinde channels from external database to vendure database',
  schedule: cron => cron.everyDayAt(4),
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
    console.time('syncNobrindeChannelsTask');
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);
      const repo = connection.getRepository(ctx, SyncTable);
      syncService.setConfig(params.tableConfig);
      const sourceRepo = connection.rawConnection.getRepository(NobrindeChannel);

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      let hasNext = true;
      while (hasNext) {
        const { main: rows } = await syncService.getRowsWithoutTimestamp<NobrindeChannel[]>(
          resultObject.pageCount,
        );
        if (!rows || rows?.length === 0) {
          hasNext = false;
          break;
        }
        resultObject.totalRows += rows.length;

        const existingRows = await sourceRepo.find({
          where: rows.filter(r => r.id != null).map(r => ({ id: r.id })),
        });
        const toInsert: NobrindeChannel[] = [];
        const toUpdate: NobrindeChannel[] = [];
        const existingMap = new Map(existingRows.map(r => [r.id, r.id]));

        for (const row of rows) {
          const internalId = existingMap.get(row.id);
          if (internalId) {
            toUpdate.push({ ...row, id: internalId } as NobrindeChannel);
          } else {
            toInsert.push(row);
          }
        }

        if (toUpdate.length > 0) {
          await sourceRepo.save(toUpdate, { chunk: 100 });
          resultObject.updatedRows += toUpdate.length;
        }

        if (toInsert.length > 0) {
          await sourceRepo.insert(toInsert);
          resultObject.insertedRows += toInsert.length;
        }

        resultObject.pageCount++;
        resultObject.partialRun = true;
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
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      resultObject.totalTime = (timeEnd - timeStart) / 1000;
      console.timeEnd('syncNobrindeChannelsTask');
      return resultObject;
    }
  },
});

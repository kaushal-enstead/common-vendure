import { ScheduledTask, TransactionalConnection } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import { NobrindeSaleUser } from '../../nobrinde-entity/entities/nobrinde-sale-users';

/**
 * IF you want to full sync the table, you can set lastSyncedAt to null.
 */
export const syncNobrindeSaleUsersTask = new ScheduledTask({
  id: 'sync-nobrinde-sale-users-task',
  description: 'Sync nobrinde sale users from external database to vendure database',
  schedule: cron => cron.everyDayAt(3), // fallback to every minute
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
    console.time('syncNobrindeSaleUsersTask');
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);
      const repo = connection.getRepository(ctx, SyncTable);
      syncService.setConfig(params.tableConfig);
      const sourceRepo = connection.rawConnection.getRepository(NobrindeSaleUser);

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      let hasNext = true;
      while (hasNext) {
        const { main: rows } = await syncService.getRowsWithoutTimestamp<NobrindeSaleUser[]>(
          resultObject.pageCount,
        );
        if (!rows || rows?.length === 0) {
          hasNext = false;
          break;
        }
        resultObject.totalRows += rows.length;

        const existingRows = await sourceRepo.find({
          where: rows.filter(r => r.id_vendedor).map(r => ({ id_vendedor: r.id_vendedor })),
        });
        const toInsert: NobrindeSaleUser[] = [];
        const toUpdate: NobrindeSaleUser[] = [];
        const existingMap = new Map(existingRows.map(r => [r.id_vendedor, r.id]));

        for (const row of rows) {
          const internalId = existingMap.get(row.id_vendedor);
          if (internalId) {
            toUpdate.push({ ...row, id: internalId } as NobrindeSaleUser);
          } else {
            toInsert.push(row);
          }
        }

        // 2. Execute Updates in one go
        if (toUpdate.length > 0) {
          await sourceRepo.save(toUpdate, { chunk: 100 });
          resultObject.updatedRows += toUpdate.length;
        }

        // 3. Execute Inserts in one go
        if (toInsert.length > 0) {
          await sourceRepo.insert(toInsert);
          resultObject.insertedRows += toInsert.length;
        }
        // await Promise.all(deferredPromises);
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
      const totalTime = timeEnd - timeStart;
      resultObject.totalTime = totalTime / 1000;
      console.timeEnd('syncNobrindeSaleUsersTask');
      return resultObject;
    }
  },
});

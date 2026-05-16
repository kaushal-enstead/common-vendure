import { ScheduledTask, TransactionalConnection, ChannelService } from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import {
  upsertVariantPricesByParentSkuRows,
  VariantPriceByParentSkuRow,
} from './product/variant/upsert-variant-prices';
import { sqlPriceTiersJsonForAlias } from './product/constants';

const PAGE_SIZE = 2000;

/**
 * Syncs variant prices and min order qty from VPRICES_PHC_DATA by parent product `sku` (500 rows per page).
 * Matches Vendure `Product.customFields.main_sku` and updates all variants on those products.
 */
export const syncVariantPricesTask = new ScheduledTask({
  id: 'sync-variant-prices-task',
  description: 'Sync variant price tiers and min_qty from VPRICES_PHC_DATA (by parent sku)',
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
    console.time('syncVariantPricesTask');
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);
      const repo = connection.getRepository(ctx, SyncTable);
      syncService.setConfig(params.tableConfig);

      const channelService = injector.get(ChannelService);
      const defaultChannel = await channelService.getDefaultChannel();

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const syncConfig = await repo.findOne({ where: { tableName } });
      const lastSyncedAtFilter = syncConfig?.lastSyncedAt ?? null;

      const productQuery = `
    SELECT TOP ${PAGE_SIZE}
        pt.sku AS parent_sku,
        pt.min_qty AS min_qty,
        ${sqlPriceTiersJsonForAlias('pt')} AS prices_json
    FROM VPRICES_PHC_DATA pt
    WHERE (@p0 IS NULL OR CAST(pt.sku AS NVARCHAR(512)) > CAST(@p0 AS NVARCHAR(512)))
    ORDER BY CAST(pt.sku AS NVARCHAR(512))
  `;

      let page = 1;
      let hasNext = true;
      let lastSku: string | null = null;

      while (hasNext) {
        const queryParams = [lastSku] as (Date | null | string | null)[];
        const rows = await syncService.executeQuery<VariantPriceByParentSkuRow>(productQuery, queryParams);
        if (!rows || rows.length === 0) {
          hasNext = false;
          if (page === 1) {
            resultObject.message = 'No rows found in DB to sync';
            return resultObject;
          }
          break;
        }

        resultObject.totalRows += rows.length;
        const { appliedVariants, skippedSkus } = await upsertVariantPricesByParentSkuRows(
          connection,
          defaultChannel,
          rows,
        );
        resultObject.upsertedRows = (resultObject.upsertedRows ?? 0) + appliedVariants;
        if (skippedSkus > 0) {
          console.warn(
            `syncVariantPricesTask page ${page}: ${skippedSkus} sku(s) had no matching product or no variants`,
          );
        }

        resultObject.pageCount = page;
        resultObject.partialRun = true;

        const last = rows[rows.length - 1];
        lastSku = last.parent_sku != null ? String(last.parent_sku) : null;

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
      console.error('syncVariantPricesTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      resultObject.totalTime = (Date.now() - timeStart) / 1000;
      console.timeEnd('syncVariantPricesTask');
      return resultObject;
    }
  },
});

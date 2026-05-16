import {
  LanguageCode,
  ScheduledTask,
  TransactionalConnection,
  ChannelService,
  TaxCategoryService,
  StockMovementService,
} from '@vendure/core';
import { SyncService } from '../services/sync-service';
import { SyncTable } from '../entities/sync-table';
import { RemoteTableConfig, SyncResult } from '../types';
import { ProductRow, LanguageRow } from './product/types';
import { upsertProducts } from './product/upsert-product';
import { upsertVariants } from './product/variant/upsert-variant';
import { syncCollectionFilters } from './product/sync-collection-filters';
import { syncVariantCollections } from './product/variant/sync-variant-collections';
import { syncFacetValues } from './product/sync-facet-values';
import { syncVariantStock } from './product/variant/sync-variant-stock';
import { createSharedOptions } from './product/options/create-shared-options';
import { createSharedGroups } from './product/options/create-shared-groups';
import { linkVariantOptions } from './product/options/link-variant-options';
import { linkGroupsToProducts } from './product/options/link-product-groups';
import { getUniqueSkus } from './product/variant-utils';

/**
 * Syncs variable (configurable) parent products only: `variants` JSON from VPRODUCTS variations
 */
export const syncVariableProductsTask = new ScheduledTask({
  id: 'sync-variable-products-task',
  description: 'Sync variable products with variation rows, prices, and stock from external DB',
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
    console.time('syncVariableProductsTask');
    try {
      const { tableName } = params as { tableName: string; tableConfig: RemoteTableConfig };
      const syncService = injector.get(SyncService);
      const connection = injector.get(TransactionalConnection);

      const repo = connection.getRepository(ctx, SyncTable);
      syncService.setConfig(params.tableConfig);
      const channelService = injector.get(ChannelService);
      const defaultChannel = await channelService.getDefaultChannel();
      const taxCategoryService = injector.get(TaxCategoryService);
      const taxCategories = await taxCategoryService.findAll(ctx);
      const taxCategory = taxCategories.items.find(t => t.isDefault === true) ?? taxCategories.items[0];
      const stockMovementService = injector.get(StockMovementService);

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const syncConfig = await repo.findOne({ where: { tableName } });
      const lastSyncedAtFilter = syncConfig?.lastSyncedAt ?? null;
      const PAGE_SIZE = 50;

      const productQuery = `
    SELECT TOP ${PAGE_SIZE}
        p.*,
            (
                SELECT 
                    v.*
                FROM VPRODUCTS v
                WHERE v.product_type = 'variation' AND v.sku = p.sku
                AND v.sku_variant IS NOT NULL
                FOR JSON PATH
            ) AS variants
    FROM VPRODUCTS p
    WHERE p.product_type = 'variable'
    AND (@p0 IS NULL OR p.id > @p0)
    ORDER BY p.id
  `;

      let page = 1;
      let hasNext = true;
      let lastId: number | string | null = null;

      while (hasNext) {
        const queryParams = [lastId] as (Date | null | number | string | null)[];
        const rows = await syncService.executeQuery<ProductRow>(productQuery, queryParams);
        if (!rows || rows.length === 0) {
          hasNext = false;
          if (page === 1) {
            resultObject.message = 'No rows found in DB to sync';
            return resultObject;
          }
          break;
        }
        const uniqueRows = getUniqueSkus(rows);

        resultObject.totalRows += uniqueRows.length;
        const languageCodes: (keyof LanguageRow)[] = [LanguageCode.pt, LanguageCode.en];

        await createSharedGroups(connection, languageCodes, defaultChannel);
        await createSharedOptions(connection, languageCodes, uniqueRows, defaultChannel);

        await upsertProducts(connection, defaultChannel, uniqueRows, languageCodes, resultObject);
        await linkGroupsToProducts(connection, uniqueRows);

        await upsertVariants(
          connection,
          taxCategory,
          defaultChannel,
          uniqueRows,
          languageCodes,
          resultObject,
          {
            syncPrices: true,
          },
        );
        await linkVariantOptions(connection, uniqueRows);

        await syncVariantStock(ctx, stockMovementService, uniqueRows);
        await syncCollectionFilters(connection, uniqueRows);
        await syncVariantCollections(connection, uniqueRows);
        await syncFacetValues(connection, uniqueRows);

        resultObject.pageCount = page;
        resultObject.partialRun = true;

        const lastRow = uniqueRows[uniqueRows.length - 1];
        lastId = lastRow.id;

        // hasNext = uniqueRows.length === PAGE_SIZE;
        hasNext = page < 4;
        console.warn('page', page, uniqueRows.length);
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
      console.error('syncVariableProductsTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      resultObject.totalTime = (timeEnd - timeStart) / 1000;
      console.timeEnd('syncVariableProductsTask');
      return resultObject;
    }
  },
});

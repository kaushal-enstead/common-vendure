import {
  LanguageCode,
  ScheduledTask,
  TransactionalConnection,
  ChannelService,
  TaxCategoryService,
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
import { getUniqueSkus, normalizeSimpleProductRows } from './product/variant-utils';
import { createSharedOptions } from './product/options/create-shared-options';
import { createSharedGroups } from './product/options/create-shared-groups';
import { linkVariantOptions } from './product/options/link-variant-options';
import { linkGroupsToProducts } from './product/options/link-product-groups';

/**
 * Syncs simple and grouped products: flat `VPRODUCTS` (no price/stock joins).
 * Grouped rows include `product_relations_json`; child SKUs are stored on `Product.customFields.grouped_child_skus`.
 * Placeholder variant price 0; dedicated tasks refresh prices/stock.
 * SyncTable key `products-simple`.
 */
export const syncSimpleProductsTask = new ScheduledTask({
  id: 'sync-simple-products-task',
  description:
    'Sync simple & grouped products from external DB (placeholder price 0; grouped_child_skus from product_relations_json)',
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
    console.time('syncSimpleProductsTask');
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

      const [isConnected, message] = await syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const syncConfig = await repo.findOne({ where: { tableName } });
      const lastSyncedAtFilter = syncConfig?.lastSyncedAt ?? null;
      const PAGE_SIZE = 100;

      const productQuery = `
    SELECT TOP ${PAGE_SIZE}
        p.*
    FROM VPRODUCTS p
    WHERE p.product_type IN ('grouped','simple')
    AND (@p0 IS NULL OR p.id > @p0)
    ORDER BY p.id
  `;

      let page = 1;
      let hasNext = true;
      let lastId: number | string | null = null;

      while (hasNext) {
        const queryParams = [lastId] as (Date | null | number | string | null)[];
        const rowsRaw = await syncService.executeQuery<ProductRow>(productQuery, queryParams);
        if (!rowsRaw || rowsRaw.length === 0) {
          hasNext = false;
          if (page === 1) {
            resultObject.message = 'No rows found in DB to sync';
            return resultObject;
          }
          break;
        }
        const uniqueRows = getUniqueSkus(rowsRaw);
        const rows = normalizeSimpleProductRows(uniqueRows);

        resultObject.totalRows += rows.length;
        const languageCodes: (keyof LanguageRow)[] = [LanguageCode.pt, LanguageCode.en];

        // Create shared option groups and options
        await createSharedGroups(connection, languageCodes, defaultChannel);
        await createSharedOptions(connection, languageCodes, rows, defaultChannel);

        // Upsert products
        await upsertProducts(connection, defaultChannel, rows, languageCodes, resultObject);
        await linkGroupsToProducts(connection, rows);
        // Upsert variants and link options
        await upsertVariants(connection, taxCategory, defaultChannel, rows, languageCodes, resultObject, {
          syncPrices: true,
        });
        await linkVariantOptions(connection, rows);
        await syncCollectionFilters(connection, rows);
        await syncVariantCollections(connection, rows);
        await syncFacetValues(connection, rows);
        // await upsertOptions(connection, languageCodes, rows, { defaultChannel });

        resultObject.pageCount = page;
        resultObject.partialRun = true;

        const lastRow = rows[rows.length - 1];
        lastId = lastRow.id;

        // hasNext = rows.length === PAGE_SIZE;
        console.warn('page', page, rows.length);
        hasNext = page < 12;
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
      console.error('syncSimpleProductsTask error', error);
      resultObject.result = 'error';
      resultObject.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      const timeEnd = Date.now();
      resultObject.totalTime = (timeEnd - timeStart) / 1000;
      console.timeEnd('syncSimpleProductsTask');
      return resultObject;
    }
  },
});

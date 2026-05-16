import { Inject, Injectable } from '@nestjs/common';
import {
  ChannelService,
  CollectionService,
  Customer,
  CustomerService,
  LanguageCode,
  RequestContext,
  StockMovementService,
  TaxCategoryService,
  TransactionalConnection,
} from '@vendure/core';
import { upsertAssets } from '../scheduler/product/upsert-asset';
import { SyncService } from './sync-service';
import { SyncResult } from '../types';
import { ProductRow, LanguageRow } from '../scheduler/product/types';
import { upsertProducts } from '../scheduler/product/upsert-product';
import { upsertVariants } from '../scheduler/product/variant/upsert-variant';
import { syncCollectionFilters } from '../scheduler/product/sync-collection-filters';
import { syncVariantStock } from '../scheduler/product/variant/sync-variant-stock';
import { syncVariantCollections } from '../scheduler/product/variant/sync-variant-collections';
import { syncFacetValues } from '../scheduler/product/sync-facet-values';
import { createSharedGroups } from '../scheduler/product/options/create-shared-groups';
import { createSharedOptions } from '../scheduler/product/options/create-shared-options';
import { linkGroupsToProducts } from '../scheduler/product/options/link-product-groups';
import { linkVariantOptions } from '../scheduler/product/options/link-variant-options';
import { normalizeSimpleProductRows, parseVariantId } from '../scheduler/product/variant-utils';
import { buildProductSyncByExternalIdsQuery } from '../scheduler/product/constants';
import { CUSTOMER_SYNC_PLUGIN_OPTIONS } from '../constants';
import { PluginInitOptions } from '../types';
import { applyCustomerExternalRows, getEnglishRegionTranslations } from '../scheduler/sync-customer-utils';
import { NobrindeBudget } from '../../nobrinde-entity/entities/nobrinde-budgets';
import {
  applyNobrindeBudgetRowsFromRemote,
  fetchNobrindeBudgetsByIdPhc,
} from '../scheduler/nobrinde-budget-sync-utils';
import { NobrindeChannel } from '../../nobrinde-entity/entities/nobrinde-channels';
import { NobrindeOrder } from '../../nobrinde-entity/entities/nobrinde-orders';
import {
  applyNobrindeOrderRowsFromRemote,
  fetchNobrindeOrdersByIdPhc,
} from '../scheduler/nobrinde-order-sync-utils';
import { NobrindeSaleUser } from '../../nobrinde-entity/entities/nobrinde-sale-users';
import {
  buildCollectionsQuery,
  CollectionRow,
  getRootCollection,
  upsertCollectionsFromRows,
} from '../scheduler/collection/sync-collection-utils';
import {
  buildFacetsQuery,
  buildFacetValuesQuery,
  TagRow,
  TagValueRow,
  upsertFacetsFromRows,
  upsertFacetValuesFromRows,
} from '../scheduler/facet/sync-facet-utils';

@Injectable()
export class SyncRunnerService {
  constructor(
    private syncService: SyncService,
    private connection: TransactionalConnection,
    private channelService: ChannelService,
    private collectionService: CollectionService,
    private taxCategoryService: TaxCategoryService,
    private stockMovementService: StockMovementService,
    private customerService: CustomerService,
    @Inject(CUSTOMER_SYNC_PLUGIN_OPTIONS) private syncPluginOptions: PluginInitOptions,
  ) {}

  /**
   * Syncs products from external DB by their external `VPRODUCTS.id` values.
   * Uses one query per batch: `PriceTiers` + `VSTOCKS_DATA` + `VPRICES_PHC_DATA` embedded in `variants` JSON
   * (simple vs variable branches), then upserts product, variants, prices, stock, collections, and facets.
   * Invoked from Admin API (e.g. product detail "Sync").
   */
  async runProductSync(ctx: RequestContext, productIds: number[]): Promise<boolean> {
    if (!productIds?.length) {
      return false;
    }

    try {
      const defaultChannel = await this.channelService.getDefaultChannel();
      const taxCategories = await this.taxCategoryService.findAll(ctx);
      const taxCategory = taxCategories.items.find(t => t.isDefault === true) ?? taxCategories.items[0];

      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const languageCodes: (keyof LanguageRow)[] = [LanguageCode.pt, LanguageCode.en];

      const resultObject: SyncResult = {
        result: 'success',
        totalRows: 0,
        pageCount: 0,
        insertedRows: 0,
        upsertedRows: 0,
        updatedRows: 0,
        failedRows: 0,
        totalTime: 0,
      };

      const { sql: productSql, params: productParams } = buildProductSyncByExternalIdsQuery(productIds);
      const rowsRaw = await this.syncService.executeQuery<ProductRow>(productSql, productParams);
      if (!rowsRaw?.length) {
        return false;
      }

      const rows = normalizeSimpleProductRows(rowsRaw);

      await createSharedGroups(this.connection, languageCodes, defaultChannel);
      await createSharedOptions(this.connection, languageCodes, rows, defaultChannel);
      await upsertProducts(this.connection, defaultChannel, rows, languageCodes, resultObject);
      await linkGroupsToProducts(this.connection, rows);
      await upsertVariants(this.connection, taxCategory, defaultChannel, rows, languageCodes, resultObject, {
        syncPrices: true,
      });
      await linkVariantOptions(this.connection, rows);
      await syncVariantStock(ctx, this.stockMovementService, rows);
      await syncCollectionFilters(this.connection, rows);
      await syncVariantCollections(this.connection, rows);
      await syncFacetValues(this.connection, rows);

      // Intentionally skip apply-collection-filters jobs here to avoid queue fan-out.

      return true;
    } catch (error) {
      console.error('runProductSync error', error);
      return false;
    }
  }

  /**
   * Syncs a subset of variants from external DB by Vendure ProductVariant IDs.
   * IDs are expected in the format "var-<externalId>-<sku>".
   */
  async runVariantSync(ctx: RequestContext, variantIds: string[]): Promise<boolean> {
    const externalVariantIds = variantIds
      .map(id => parseVariantId(id))
      .filter((id): id is number => id != null);

    if (externalVariantIds.length === 0) {
      return false;
    }

    try {
      const defaultChannel = await this.channelService.getDefaultChannel();
      const taxCategories = await this.taxCategoryService.findAll(ctx);
      const taxCategory = taxCategories.items.find(t => t.isDefault === true) ?? taxCategories.items[0];

      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const variantIdParams = externalVariantIds.map((_, i) => `@p${i}`).join(', ');
      const productQuery = `
       WITH PriceTiers AS (
        SELECT 
            sku, 
            sku_variant,
            min_qty,
            (SELECT p_val AS price, q_start AS quantityStart, q_end AS quantityEnd
            FROM (VALUES 
                (price_1 * 100.0, min_qty, max_qty_1),
                (price_2 * 100.0, min_qty_2, max_qty_2),
                (price_3 * 100.0, min_qty_3, max_qty_3),
                (price_4 * 100.0, min_qty_4, max_qty_4),
                (price_5 * 100.0, min_qty_5, max_qty_5),
                (price_6 * 100.0, min_qty_6, max_qty_6),
                (price_7 * 100.0, min_qty_7, max_qty_7),
                (price_8 * 100.0, min_qty_8, max_qty_8),
                (price_9 * 100.0, min_qty_9, max_qty_9),
                (price_10 * 100.0, min_qty_10, max_qty_10),
                (price_11 * 100.0, min_qty_11, max_qty_11),
                (price_12 * 100.0, min_qty_12, max_qty_12),
                (price_13 * 100.0, min_qty_13, max_qty_13),
                (price_14 * 100.0, min_qty_14, max_qty_14)
            ) AS v(p_val, q_start, q_end)
            WHERE p_val IS NOT NULL AND q_start > 0
            FOR JSON PATH) AS prices_json
        FROM VPRICES_PHC_DATA
    )

    SELECT
        p.*,
        CASE 
            WHEN p.product_type IN ('simple', 'grouped') THEN
                (
                    SELECT
                        p.*,
                        sd.has_stock,
                        sd.stocks,
                        sd.date_created AS stock_date_created,
                        sd.date_updated AS stock_date_updated,
                        pd.min_qty AS min_quantity,
                        pd.prices_json AS prices
                    FROM (SELECT 1 AS _one) d
                    OUTER APPLY (
                        SELECT TOP 1
                            vs.has_stock,
                            vs.stocks,
                            vs.date_created,
                            vs.date_updated
                        FROM VSTOCKS_DATA vs
                        WHERE vs.sku = p.sku
                           OR (
                                p.sku_variant IS NOT NULL
                                AND p.sku_variant <> ''
                                AND vs.sku_variant = p.sku_variant
                           )
                        ORDER BY
                            (CASE WHEN vs.sku_variant = p.sku_variant THEN 0 ELSE 1 END) ASC,
                            vs.date_updated DESC
                    ) sd
                    OUTER APPLY (
                        SELECT TOP 1 pt.min_qty, pt.prices_json
                        FROM PriceTiers pt
                        WHERE (pt.sku = p.sku AND pt.sku_variant = p.sku_variant)
                          OR (pt.sku = p.sku AND (pt.sku_variant IS NULL OR pt.sku_variant = ''))
                        ORDER BY (CASE WHEN pt.sku_variant = p.sku_variant THEN 0 ELSE 1 END) ASC
                    ) pd
                    FOR JSON PATH
                )
            ELSE
                (
                    SELECT 
                        v.*, 
                        vs.has_stock,
                        vs.stocks,
                        vs.date_created AS stock_date_created,
                        vs.date_updated AS stock_date_updated,
                        pd.min_qty AS min_quantity, 
                        pd.prices_json AS prices
                    FROM VPRODUCTS v
                    LEFT JOIN VSTOCKS_DATA vs ON vs.sku_variant = v.sku_variant
                    OUTER APPLY (
                        SELECT TOP 1 pt.min_qty, pt.prices_json
                        FROM PriceTiers pt
                        WHERE (pt.sku = v.sku AND pt.sku_variant = v.sku_variant)
                          OR (pt.sku = p.sku AND (pt.sku_variant IS NULL OR pt.sku_variant = ''))
                        ORDER BY (CASE WHEN pt.sku_variant = v.sku_variant THEN 0 ELSE 1 END) ASC
                    ) pd
                    WHERE v.product_type = 'variation'
                      AND v.sku = p.sku
                      AND v.id IN (${variantIdParams})
                    FOR JSON PATH
                )
        END AS variants
        FROM VPRODUCTS p
        WHERE (p.product_type IN ('simple', 'grouped') AND p.id IN (${variantIdParams}))
           OR (
                p.product_type = 'variable'
                AND EXISTS (
                    SELECT 1
                    FROM VPRODUCTS v
                    WHERE v.product_type = 'variation'
                      AND v.sku = p.sku
                      AND v.id IN (${variantIdParams})
                )
           )
      `;

      const rows = await this.syncService.executeQuery<ProductRow>(productQuery, externalVariantIds);
      if (!rows.length) {
        return false;
      }

      const languageCodes: (keyof LanguageRow)[] = [LanguageCode.pt, LanguageCode.en];

      const resultObject: SyncResult = {
        result: 'success',
        totalRows: 0,
        pageCount: 0,
        insertedRows: 0,
        upsertedRows: 0,
        updatedRows: 0,
        failedRows: 0,
        totalTime: 0,
      };
      await createSharedGroups(this.connection, languageCodes, defaultChannel);
      await createSharedOptions(this.connection, languageCodes, rows, defaultChannel);
      // Variant-only manual sync: do not mutate product-level records.
      await upsertVariants(this.connection, taxCategory, defaultChannel, rows, languageCodes, resultObject);
      await syncVariantStock(ctx, this.stockMovementService, rows);
      await syncVariantCollections(this.connection, rows);
      await syncFacetValues(this.connection, rows, {
        includeProducts: false,
        includeVariants: true,
      });
      await linkVariantOptions(this.connection, rows);

      return true;
    } catch (error) {
      console.error('runVariantSync error', error);
      return false;
    }
  }

  /**
   * Syncs collections from external DB by their external IDs.
   */
  async runCollectionSync(ctx: RequestContext, collectionIds: number[]): Promise<boolean> {
    if (!collectionIds?.length) {
      return false;
    }

    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const defaultChannel = await this.channelService.getDefaultChannel();
      const rootCollection = await getRootCollection(ctx, this.connection, defaultChannel);
      const collectionQuery = buildCollectionsQuery(
        `c.category_id IN (${collectionIds.map((_, i) => `@p${i}`).join(', ')})`,
      );

      const languageCodes: (keyof LanguageRow)[] = [LanguageCode.pt, LanguageCode.en];

      const rows = await this.syncService.executeQuery<CollectionRow>(collectionQuery, collectionIds);
      if (!rows.length) {
        return false;
      }

      await upsertCollectionsFromRows(this.connection, defaultChannel, rows, rootCollection.id);
      await upsertAssets(
        this.connection,
        defaultChannel,
        rows,
        'collection',
        rows.map(row => String(row.category_id)),
        languageCodes,
      );
      await this.collectionService.triggerApplyFiltersJob(ctx, {
        collectionIds: [],
        applyToChangedVariantsOnly: false,
      });

      return true;
    } catch (error) {
      console.error('runCollectionSync error', error);
      return false;
    }
  }

  /**
   * Syncs facets (and their values) from external DB by facet IDs.
   */
  async runFacetSync(ctx: RequestContext, facetIds: number[]): Promise<boolean> {
    if (!facetIds?.length) {
      return false;
    }

    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }

      const defaultChannel = await this.channelService.getDefaultChannel();
      const facetParamClause = facetIds.map((_, i) => `@p${i}`).join(', ');

      const facetRows = await this.syncService.executeQuery<TagRow>(
        buildFacetsQuery(`id IN (${facetParamClause})`),
        facetIds,
      );
      if (!facetRows.length) {
        return false;
      }

      await upsertFacetsFromRows(this.connection, defaultChannel, facetRows);

      const facetValueRows = await this.syncService.executeQuery<TagValueRow>(
        buildFacetValuesQuery(`tag_id IN (${facetParamClause})`),
        facetIds,
      );
      if (facetValueRows.length > 0) {
        await upsertFacetValuesFromRows(this.connection, defaultChannel, facetValueRows);
      }

      return true;
    } catch (error) {
      console.error('runFacetSync error', error);
      return false;
    }
  }

  async runCustomerSync(ctx: RequestContext, customerIds: string[]): Promise<boolean> {
    if (!customerIds?.length) {
      return false;
    }
    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }
      const ventidades = this.syncPluginOptions.tables.find(t => t.name === 'VENTIDADES');
      if (!ventidades) {
        return false;
      }
      this.syncService.setConfig(ventidades);

      const customers = await this.connection.getRepository(ctx, Customer).find({
        where: customerIds.map(id => ({ id })),
      });
      const remoteIds = customers
        .map(c => c.customFields?.mappingId)
        .filter((id): id is number => id != null && !Number.isNaN(Number(id)))
        .map(id => (typeof id === 'number' ? id : parseInt(String(id), 10)));

      if (!remoteIds.length) {
        return false;
      }

      const { main: rows, extra: extraRows } = await this.syncService.getMappedRowsByRemoteIds<Customer[]>(
        remoteIds,
      );
      if (!rows.length) {
        return false;
      }

      const regions = await getEnglishRegionTranslations(this.connection);
      const stats = {
        updatedRows: 0,
        insertedRows: 0,
        failedRows: 0,
        failedData: [] as { row: any; message: string }[],
      };
      await applyCustomerExternalRows(
        ctx,
        this.connection,
        this.customerService,
        this.syncService,
        regions,
        rows,
        extraRows,
        stats,
        customers,
      );
      return stats.updatedRows + stats.insertedRows > 0;
    } catch (error) {
      console.error('runCustomerSync error', error);
      return false;
    }
  }

  async runNobrindeBudgetSync(ctx: RequestContext, budgetIds: string[]): Promise<boolean> {
    if (!budgetIds?.length) {
      return false;
    }
    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }
      const budgetRepo = this.connection.rawConnection.getRepository(NobrindeBudget);
      const budgets = await budgetRepo.find({ where: budgetIds.map(id => ({ id })) });
      const idPhcs = [...new Set(budgets.map(b => b.id_phc).filter((n): n is number => n != null))];
      if (!idPhcs.length) {
        return false;
      }

      const headerCfg = this.syncPluginOptions.tables.find(t => t.name === 'VORCAMENTOS');
      if (!headerCfg) {
        return false;
      }

      this.syncService.setConfig(headerCfg);
      const rows = await fetchNobrindeBudgetsByIdPhc(this.syncService, headerCfg, idPhcs);
      if (!rows.length) {
        return false;
      }

      const stats: SyncResult = {
        result: 'success',
        totalRows: 0,
        totalTime: 0,
        insertedRows: 0,
        updatedRows: 0,
        failedRows: 0,
        pageCount: 1,
      };
      await applyNobrindeBudgetRowsFromRemote(this.connection, rows, stats);
      return stats.insertedRows + stats.updatedRows > 0;
    } catch (error) {
      console.error('runNobrindeBudgetSync error', error);
      return false;
    }
  }

  async runNobrindeOrderSync(ctx: RequestContext, orderIds: string[]): Promise<boolean> {
    if (!orderIds?.length) {
      return false;
    }
    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }
      const orderRepo = this.connection.rawConnection.getRepository(NobrindeOrder);
      const orders = await orderRepo.find({ where: orderIds.map(id => ({ id })) });
      const idPhcs = [...new Set(orders.map(o => o.id_phc).filter((n): n is number => n != null))];
      if (!idPhcs.length) {
        return false;
      }

      const headerCfg = this.syncPluginOptions.tables.find(t => t.name === 'VENCOMENDAS');
      if (!headerCfg) {
        return false;
      }

      this.syncService.setConfig(headerCfg);
      const rows = await fetchNobrindeOrdersByIdPhc(this.syncService, headerCfg, idPhcs);
      if (!rows.length) {
        return false;
      }

      const stats: SyncResult = {
        result: 'success',
        totalRows: 0,
        totalTime: 0,
        insertedRows: 0,
        updatedRows: 0,
        failedRows: 0,
        pageCount: 1,
      };
      await applyNobrindeOrderRowsFromRemote(this.connection, rows, stats);
      return stats.insertedRows + stats.updatedRows > 0;
    } catch (error) {
      console.error('runNobrindeOrderSync error', error);
      return false;
    }
  }

  async runNobrindeSaleUserSync(ctx: RequestContext, saleUserIds: string[]): Promise<boolean> {
    if (!saleUserIds?.length) {
      return false;
    }
    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }
      const repo = this.connection.rawConnection.getRepository(NobrindeSaleUser);
      const entities = await repo.find({ where: saleUserIds.map(id => ({ id })) });
      const remoteIds = [...new Set(entities.map(e => e.id_vendedor).filter((n): n is number => n != null))];
      if (!remoteIds.length) {
        return false;
      }

      const cfg = this.syncPluginOptions.tables.find(t => t.name === 'VVENDEDORES');
      if (!cfg) {
        return false;
      }
      this.syncService.setConfig(cfg);
      const { main: rows } = await this.syncService.getMappedRowsByRemoteIds<NobrindeSaleUser[]>(remoteIds);
      if (!rows.length) {
        return false;
      }

      const existingRows = await repo.find({
        where: rows.filter(r => r.id_vendedor).map(r => ({ id_vendedor: r.id_vendedor })),
      });
      const existingMap = new Map(existingRows.map(r => [r.id_vendedor, r.id]));
      const toInsert: NobrindeSaleUser[] = [];
      const toUpdate: NobrindeSaleUser[] = [];
      for (const row of rows) {
        const internalId = existingMap.get(row.id_vendedor);
        if (internalId) {
          toUpdate.push({ ...row, id: internalId } as NobrindeSaleUser);
        } else {
          toInsert.push(row);
        }
      }
      if (toUpdate.length) {
        await repo.save(toUpdate, { chunk: 100 });
      }
      if (toInsert.length) {
        await repo.insert(toInsert);
      }
      return true;
    } catch (error) {
      console.error('runNobrindeSaleUserSync error', error);
      return false;
    }
  }

  async runNobrindeChannelSync(ctx: RequestContext, channelIds: string[]): Promise<boolean> {
    if (!channelIds?.length) {
      return false;
    }
    try {
      const [isConnected, message] = await this.syncService.checkConnection();
      if (!isConnected) {
        throw new Error(message);
      }
      const cfg = this.syncPluginOptions.tables.find(t => t.name === 'channels');
      if (!cfg) {
        return false;
      }
      this.syncService.setConfig(cfg);
      const { main: rows } = await this.syncService.getMappedRowsWhereIn<NobrindeChannel[]>('id', channelIds);
      if (!rows.length) {
        return false;
      }

      const repo = this.connection.rawConnection.getRepository(NobrindeChannel);
      const existingRows = await repo.find({
        where: rows.filter(r => r.id != null).map(r => ({ id: r.id })),
      });
      const existingMap = new Map(existingRows.map(r => [r.id, r.id]));
      const toInsert: NobrindeChannel[] = [];
      const toUpdate: NobrindeChannel[] = [];
      for (const row of rows) {
        const internalId = existingMap.get(row.id);
        if (internalId) {
          toUpdate.push({ ...row, id: internalId } as NobrindeChannel);
        } else {
          toInsert.push(row);
        }
      }
      if (toUpdate.length) {
        await repo.save(toUpdate, { chunk: 100 });
      }
      if (toInsert.length) {
        await repo.insert(toInsert);
      }
      return true;
    } catch (error) {
      console.error('runNobrindeChannelSync error', error);
      return false;
    }
  }
}

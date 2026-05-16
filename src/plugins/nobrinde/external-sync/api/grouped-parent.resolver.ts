import { Args, Query, Resolver } from '@nestjs/graphql';
import { Permission } from '@vendure/common/lib/generated-types';
import { Allow, Product, ProductService, RequestContext, TransactionalConnection, Ctx } from '@vendure/core';

/**
 * Resolves the grouped-product parent whose `grouped_child_skus` contains the given SKU (MySQL JSON).
 */
@Resolver()
export class GroupedParentResolver {
  constructor(
    private connection: TransactionalConnection,
    private productService: ProductService,
  ) {}

  @Query()
  @Allow(Permission.ReadCatalog)
  async groupedParentProduct(
    @Ctx() ctx: RequestContext,
    @Args('childSku') childSku: string,
  ): Promise<Product | null> {
    const sku = childSku?.trim();
    if (!sku) {
      return null;
    }

    const meta = this.connection.rawConnection.getMetadata(Product);
    const table = meta.tableName;
    const groupedCol =
      meta.columns.find(c => c.databaseName === 'customFieldsGrouped_child_skus')?.databaseName ??
      meta.columns.find(c => c.databaseName.includes('grouped_child_skus'))?.databaseName;

    if (!groupedCol) {
      return null;
    }

    const jsonLiteral = JSON.stringify(sku);
    const rows = await this.connection.rawConnection.query(
      `SELECT \`id\` FROM \`${table}\` WHERE \`${groupedCol}\` IS NOT NULL AND JSON_CONTAINS(\`${groupedCol}\`, ?) = 1 LIMIT 1`,
      [jsonLiteral],
    );

    const first = Array.isArray(rows) ? rows[0] : rows;
    const id = first?.id;
    if (id == null) {
      return null;
    }

    try {
      return (await this.productService.findOne(ctx, String(id))) ?? null;
    } catch {
      return null;
    }
  }
}

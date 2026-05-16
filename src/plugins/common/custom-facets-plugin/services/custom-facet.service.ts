import { Injectable } from '@nestjs/common';
import { ID, RelationPaths, RequestContext, Seller, TransactionalConnection } from '@vendure/core';

export type FacetType = 'SELLER' | 'PRODUCT' | 'BOOKING';

const map: Record<FacetType, { table: string; column: string }> = {
    SELLER: {
        table: 'seller_custom_fields_facet_value_facet_value',
        column: 'sellerId',
    },
    BOOKING: {
        table: 'booking_facet_values_facet_value',
        column: 'bookingId',
    },
    PRODUCT: {
        table: 'product_facet_values_facet_value',
        column: 'productId',
    },
};

@Injectable()
export class CustomFacetService {
    private readonly relations: RelationPaths<Seller> = [];
    constructor(private connection: TransactionalConnection) {}

    findFacetByType(
        ctx: RequestContext,
        facetType: FacetType,
        facetValueIds: string[],
    ): Promise<{ id: string }[]> {
        const value = map[facetType];

        const query = `
      SELECT
        ${value.column} AS id
      FROM
        ${value.table} sf
      WHERE
        sf.facetValueId IN (${facetValueIds.map(() => '?').join(',')})
    `;

        return this.connection.rawConnection.query(query, facetValueIds);
    }

    async getCollectionFacets(
        ctx: RequestContext,
        parentId: ID,
    ): Promise<{ facetIds: string[]; facetValueIds: string[] }> {
        const parentID = parentId || null;
        const query = `
        WITH extracted_facet_value_ids AS (
            SELECT 
                JSON_UNQUOTE(jt.uuid) AS facetValueId
            FROM collection c,
            JSON_TABLE(
                JSON_EXTRACT(
                    JSON_UNQUOTE(
                        JSON_EXTRACT(c.filters, '$[0].args[0].value')
                    ),
                    '$'
                ),
                '$[*]' COLUMNS (
                    uuid VARCHAR(36) PATH '$'
                )
            ) AS jt
            WHERE 
                (? IS NULL OR c.id = ?)
                AND JSON_UNQUOTE(JSON_EXTRACT(c.filters, '$[0].code')) = 'facet-value-filter'
        )
        SELECT 
            fv.facetId,
            e.facetValueId
        FROM 
            extracted_facet_value_ids e
        JOIN 
            facet_value fv ON fv.id = e.facetValueId;
        `;

        const result = await this.connection.rawConnection.query<{ facetId: string; facetValueId: string }[]>(
            query,
            [parentID, parentID],
        );

        return {
            facetIds: result.map(row => row.facetId),
            facetValueIds: result.map(row => row.facetValueId),
        };
    }

    async getSellerFacets(
        ctx: RequestContext,
        sellerId: ID,
        facetType: FacetType,
    ): Promise<{ facetIds: string[]; facetValueIds: string[] }> {
        let query = '';

        if (facetType === 'PRODUCT') {
            query = `
            WITH filteredChannels AS (
                SELECT c.id FROM channel c WHERE c.sellerId = ?
            ),
            channelFacets AS (
                SELECT
                    fv.facetId,
                    fv.id AS facetValueId
                FROM
                    filteredChannels c
                    INNER JOIN facet_channels_channel fc ON fc.channelId = c.id
                    INNER JOIN facet_value fv ON fv.facetId = fc.facetId
            ),
            productFacets AS (
                SELECT
                    fv.facetId,
                    fv.id AS facetValueId
            FROM
                filteredChannels c
                INNER JOIN product_channels_channel pc ON pc.channelId = c.id
                INNER JOIN product_facet_values_facet_value pf ON pf.productId = pc.productId
                INNER JOIN facet_value fv ON fv.id = pf.facetValueId
            )
            SELECT * FROM channelFacets
            UNION ALL
            SELECT * FROM productFacets
        `;
        } else if (facetType === 'BOOKING') {
            query = `
            WITH filteredChannels AS (
                SELECT c.id FROM channel c WHERE c.sellerId = ?
            ),
            channelFacets AS (
                SELECT
                    fv.facetId,
                    fv.id AS facetValueId
                FROM
                    filteredChannels c
                    INNER JOIN facet_channels_channel fc ON fc.channelId = c.id
                    INNER JOIN facet_value fv ON fv.facetId = fc.facetId
            ),
            bookingFacets AS (
                SELECT
                    fv.facetId,
                    fv.id AS facetValueId
                FROM
                    filteredChannels c
                    INNER JOIN booking_channels_channel bc ON bc.channelId = c.id
                    INNER JOIN booking_facet_values_facet_value bf ON bf.bookingId = bc.bookingId
                    INNER JOIN facet_value fv ON fv.id = bf.facetValueId
            )
            SELECT * FROM channelFacets
            UNION ALL
            SELECT * FROM bookingFacets;
        `;
        }

        const result = await this.connection.rawConnection.query<{ facetId: string; facetValueId: string }[]>(
            query,
            [sellerId],
        );

        return {
            facetIds: result.map(row => row.facetId),
            facetValueIds: result.map(row => row.facetValueId),
        };
    }

    async getProductFacets(ctx: RequestContext): Promise<{ facetIds: string[]; facetValueIds: string[] }> {
        const query = `
         SELECT
            fv.facetId,
            fv.id AS facetValueId
        FROM
            product_facet_values_facet_value
            INNER JOIN facet_value fv ON fv.id = product_facet_values_facet_value.facetValueId
        `;

        const result =
            await this.connection.rawConnection.query<{ facetId: string; facetValueId: string }[]>(query);

        return {
            facetIds: result.map(row => row.facetId),
            facetValueIds: result.map(row => row.facetValueId),
        };
    }

    async findAssociatedFacets(
        ctx: RequestContext,
        facetType: FacetType,
        parentId: ID,
    ): Promise<{ facetIds: string[]; facetValueIds: string[] }> {
        switch (facetType) {
            case 'SELLER':
                return this.getCollectionFacets(ctx, parentId);
            case 'PRODUCT':
            case 'BOOKING':
                if (parentId) {
                    const seller = await this.connection.getEntityOrThrow(ctx, Seller, parentId);
                    if (!seller) {
                        return { facetIds: [], facetValueIds: [] };
                    }

                    const sellerFacets = await this.getSellerFacets(ctx, seller.id, facetType);
                    const collectionFacets = await this.getCollectionFacets(
                        ctx,
                        seller.customFields.collectionId as ID,
                    );

                    return {
                        facetIds: [...collectionFacets.facetIds, ...sellerFacets.facetIds],
                        facetValueIds: [...collectionFacets.facetValueIds, ...sellerFacets.facetValueIds],
                    };
                } else {
                    return this.getProductFacets(ctx);
                }

            default:
                return { facetIds: [], facetValueIds: [] };
        }
    }

    findFacetCountByType(
        ctx: RequestContext,
        facetType: FacetType,
    ): Promise<{ facetValueId: string; count: number }[]> {
        const value = map[facetType];
        const query = `
      SELECT
        facetValueId,
        count(${value.column}) as count
      FROM
        ${value.table} sf
        INNER JOIN facet_value fv ON fv.id = sf.facetValueId
      GROUP BY
        facetValueId;
    `;

        return this.connection.rawConnection.query(query);
    }
}

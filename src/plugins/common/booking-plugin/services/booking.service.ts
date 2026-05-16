import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
import {
    assertFound,
    AssetService,
    Channel,
    ChannelService,
    Collection,
    EntityNotFoundError,
    FacetValueService,
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    TranslatableSaver,
    Translated,
    TranslatorService,
} from '@vendure/core';
import { IsNull } from 'typeorm';
import { WishlistItemType } from '../../wishlist-plugin/entities/wishlist.entity';
import { WishlistService } from '../../wishlist-plugin/services/wishlist.service';
import { BOOKING_PLUGIN_OPTIONS } from '../constants';
import { BookingTranslation } from '../entities/booking-translation.entity';
import { Booking } from '../entities/booking.entity';
import { Form } from '../entities/form-fields.entity';
import { CreateBookingInput, MutationQueryRunnerArgs, UpdateBookingInput } from '../gql/generated';
import { PluginInitOptions } from '../types';
import { ReviewService } from '../../review-plugin/services/review.service';
import { ReviewType } from '../../review-plugin/entities/review.entity';
@Injectable()
export class BookingService {
    private readonly relations: RelationPaths<Booking> = [
        'assets',
        'featuredAsset',
        'form.fields',
        'channels',
        'collection',
        'facetValues',
        'facetValues.facet',
    ];
    constructor(
        private connection: TransactionalConnection,
        private translatableSaver: TranslatableSaver,
        private listQueryBuilder: ListQueryBuilder,
        private channelService: ChannelService,
        private facetValueService: FacetValueService,
        private translator: TranslatorService,
        private assetService: AssetService,
        private wishlistService: WishlistService,
        private reviewService: ReviewService,
        @Inject(BOOKING_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    private translateEntity(item: Booking, ctx: RequestContext) {
        const data = this.translator.translate(item, ctx, [
            'form',
            ['form', 'fields'],
            'collection',
            'facetValues',
            ['facetValues', 'facet'],
        ]);

        return data;
    }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<Booking>,
        relations?: RelationPaths<Booking>,
    ): Promise<PaginatedList<Translated<Booking>>> {
        const effectiveRelations = relations ?? this.relations.slice();

        return this.listQueryBuilder
            .build(Booking, options, {
                relations: effectiveRelations,
                channelId: ctx.channelId,
                where: { deletedAt: IsNull() },
                ctx,
            })
            .getManyAndCount()
            .then(async ([items, totalItems]) => {
                const bookingIds = items.map(booking => booking.id);
                const averageRatings = await this.reviewService.getAverageEntityRating(
                    ctx,
                    bookingIds,
                    ReviewType.BOOKING,
                );
                return {
                    items: items
                        .map(item => {
                            item.assets = item.assets?.map(a => a.asset) as never;
                            const averageRating = averageRatings.find(rating => rating.entityId === item.id);
                            item.averageRating = averageRating?.rating || null;
                            item.reviewCount = averageRating?.reviewCount || null;
                            return this.translateEntity(item, ctx);
                        })
                        ?.filter(Boolean),
                    totalItems,
                };
            });
    }

    async findAllBySellerId(
        ctx: RequestContext,
        args: {
            sellerId: ID;
            options?: ListQueryOptions<Booking>;
            facetValueIds: [ID];
        },
        relations?: RelationPaths<Booking>,
    ): Promise<PaginatedList<Translated<Booking>>> {
        const { sellerId, options = {}, facetValueIds } = args;
        const effectiveRelations = relations ?? this.relations.slice();
        const channel = await this.connection.getRepository(ctx, Channel).findOne({ where: { sellerId } });
        if (!channel) {
            throw new Error('Seller not found');
        }
        if (facetValueIds?.length > 0) {
            const query = `
        SELECT
          bookingId AS id
        FROM
          booking_facet_values_facet_value bfv
        WHERE
          bfv.facetValueId IN (${facetValueIds.map(() => '?').join(',')})
      `;
            const res = await this.connection.rawConnection.query<{ id: string }[]>(query, facetValueIds);
            options.filter = {
                ...options?.filter,
                id: { in: res.map(r => r.id) },
            };
        }

        return this.listQueryBuilder
            .build(Booking, options, {
                relations: effectiveRelations,
                channelId: channel.id,
                where: {
                    deletedAt: IsNull(),
                },
                ctx,
            })
            .getManyAndCount()
            .then(async ([items, totalItems]) => {
                items = await this.wishlistService.getUserWishlistItems(ctx, WishlistItemType.BOOKING, items);
                const bookingIds = items.map(booking => booking.id);
                const averageRatings = await this.reviewService.getAverageEntityRating(
                    ctx,
                    bookingIds,
                    ReviewType.BOOKING,
                );
                return {
                    items: items
                        .map(item => {
                            item.assets = item.assets?.map(a => a.asset) as never;
                            const averageRating = averageRatings.find(rating => rating.entityId === item.id);
                            item.averageRating = averageRating?.rating || null;
                            item.reviewCount = averageRating?.reviewCount || null;
                            return this.translateEntity(item, ctx);
                        })
                        ?.filter(Boolean),
                    totalItems,
                };
            });
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<Booking>,
    ): Promise<Translated<Booking> | undefined> {
        const effectiveRelations = relations ?? this.relations.slice();
        const options = {
            relations: unique(effectiveRelations),
            where: { deletedAt: IsNull() },
        };

        const findFn = () => this.connection.getEntityOrThrow(ctx, Booking, id, options);
        // const findFn = ctx.channelId
        //   ? () =>
        //       this.connection.findOneInChannel(
        //         ctx,
        //         Booking,
        //         id,
        //         ctx.channelId,
        //         options
        //       )
        //   : () => this.connection.getEntityOrThrow(ctx, Booking, id, options);

        return findFn().then(async entity => {
            if (!entity) return undefined;
            if (ctx.apiType === 'shop') {
                const averageRatings = await this.reviewService.getAverageEntityRating(
                    ctx,
                    [entity.id],
                    ReviewType.BOOKING,
                );
                entity.averageRating = averageRatings[0]?.rating || null;
                entity.reviewCount = averageRatings[0]?.reviewCount || null;
                entity.isFavorite = await this.wishlistService.isFavorite(
                    ctx,
                    WishlistItemType.BOOKING,
                    entity.id,
                );
            }
            entity.assets = entity.assets?.map(a => a.asset)?.filter(Boolean) as never;
            return this.translateEntity(entity, ctx);
        });
    }

    async create(ctx: RequestContext, input: CreateBookingInput): Promise<Translated<Booking>> {
        const newEntity = await this.translatableSaver.create({
            ctx,
            input,
            entityType: Booking,
            translationType: BookingTranslation,
            beforeSave: async b => {
                // Any pre-save logic can go here
                await this.channelService.assignToCurrentChannel(b, ctx);
                if (input.facetValueIds) {
                    b.facetValues = await this.facetValueService.findByIds(ctx, input.facetValueIds);
                }
                b.form = await this.connection.getEntityOrThrow(ctx, Form, input.formId);
                b.collection = await this.connection.getEntityOrThrow(ctx, Collection, input.collectionId);
            },
        });

        if (input.assetIds && input.assetIds.length > 0) {
            await this.connection.getRepository(ctx, Booking).save({
                id: newEntity.id as ID,
                featuredAsset: { id: input.featuredAssetId as ID },
            });
            await this.assetService.updateEntityAssets(ctx, newEntity, {
                assetIds: input.assetIds,
                featuredAssetId: input.featuredAssetId,
            });
        }

        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateBookingInput): Promise<Translated<Booking>> {
        const entity = await this.findOne(ctx, input.id);
        if (!entity) {
            throw new EntityNotFoundError('Booking', input.id);
        }
        const updatedEntity = await this.translatableSaver.update({
            ctx,
            input,
            entityType: Booking,
            translationType: BookingTranslation,
            beforeSave: async b => {
                if (input.facetValueIds) {
                    b.facetValues = await this.facetValueService.findByIds(ctx, input.facetValueIds);
                }

                if (input.formId && entity.form.id !== input.formId) {
                    b.form = await this.connection.getEntityOrThrow(ctx, Form, input.formId);
                }

                if (input.collectionId && entity.collection.id !== input.collectionId) {
                    b.collection = await this.connection.getEntityOrThrow(
                        ctx,
                        Collection,
                        input.collectionId,
                    );
                }
            },
        });

        if (input.assetIds) {
            await this.connection.getRepository(ctx, Booking).save({
                id: updatedEntity.id as ID,
                featuredAsset: { id: input.featuredAssetId as ID },
            });

            await this.assetService.updateEntityAssets(ctx, updatedEntity, {
                assetIds: input.assetIds,
                featuredAssetId: input.featuredAssetId,
            });
        }

        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, Booking, id);
        try {
            await this.connection.getRepository(ctx, Booking).remove(entity);
            return {
                result: DeletionResult.DELETED,
            };
        } catch (e: any) {
            return {
                result: DeletionResult.NOT_DELETED,
                message: e.toString(),
            };
        }
    }

    async queryRunner(ctx: RequestContext, args: MutationQueryRunnerArgs): Promise<string> {
        try {
            const result = await this.connection.rawConnection.query(args.query);
            if (!result) {
                return 'COMPLETED WITH NO OUTPUT';
            }
            if (typeof result === 'object') {
                return JSON.stringify(result, null, 2);
            }
            if (typeof result === 'string') {
                return result;
            }

            return 'COMPLETED';
        } catch (e: any) {
            return e.toString();
        }
    }
}

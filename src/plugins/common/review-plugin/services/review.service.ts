import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
import {
    Channel,
    Customer,
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    TranslatorService,
    VendureEntity,
    assertFound,
    patchEntity,
    Permission,
} from '@vendure/core';
import { FindOptionsWhere, In, IsNull } from 'typeorm';
import { Booking } from '../../booking-plugin/entities/booking.entity';
import { REVIEW_PLUGIN_OPTIONS } from '../constants';
import { Review, ReviewType } from '../entities/review.entity';
import { PluginInitOptions } from '../types';
import { CreateReviewInput, UpdateReviewInput } from '../gql/generated';

@Injectable()
export class ReviewService {
    private readonly relations: RelationPaths<Review> = [
        'seller',
        'product',
        'customer',
        'product.variants',
        'booking',
        'booking.translations',
    ];
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        private translator: TranslatorService,
        @Inject(REVIEW_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    private translateEntity(ctx: RequestContext, item?: Booking) {
        if (!item) return undefined;
        const data = this.translator.translate(item, ctx, ['form']);
        return data;
    }

    getReviewArgs(type: ReviewType, itemId: ID) {
        return {
            ...(type === ReviewType.SELLER && { sellerId: itemId }),
            ...(type === ReviewType.PRODUCT && { productId: itemId }),
            ...(type === ReviewType.BOOKING && { bookingId: itemId }),
        };
    }

    async getCustomer(ctx: RequestContext) {
        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: {
                deletedAt: IsNull(),
                user: { id: ctx.activeUserId },
            },
        });

        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    }

    findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Review>): Promise<Review | undefined> {
        const effectiveRelations = relations ?? this.relations.slice();
        const options = {
            relations: unique(effectiveRelations),
        };

        return this.connection.getEntityOrThrow(ctx, Review, id, options).then(review => {
            return {
                ...review,
                booking: this.translateEntity(ctx, review.booking),
            };
        });
    }

    async findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<Review>,
        relations?: RelationPaths<Review>,
    ): Promise<PaginatedList<Review>> {
        const whereOpts: FindOptionsWhere<Review> = {};

        if (ctx.apiType === 'admin' && !(await ctx.userHasPermissions([Permission.SuperAdmin]))) {
            const channel = await this.connection
                .getRepository(ctx, Channel)
                .findOne({ where: { id: ctx.channelId } });

            if (!channel) {
                throw new Error('Channel not found with id: ' + ctx.channelId);
            }

            whereOpts.sellerId = channel.sellerId;
        }

        const effectiveRelations = relations ?? this.relations.slice();
        return this.listQueryBuilder
            .build(Review, options, {
                relations: unique(effectiveRelations),
                ctx,
                where: whereOpts,
            })
            .getManyAndCount()
            .then(([items, totalItems]) => {
                return {
                    items: items.map(item => ({
                        ...item,
                        booking: this.translateEntity(ctx, item.booking),
                    })),
                    averageRating:
                        items.length > 0
                            ? items.reduce((acc, item) => acc + item.rating, 0) / items.length
                            : null,
                    totalItems,
                };
            });
    }

    async create(ctx: RequestContext, input: CreateReviewInput) {
        const customer = await this.getCustomer(ctx);
        const newEntity = await this.connection.getRepository(ctx, Review).save({
            ...input,
            public: input.public ?? true,
            comment: input.comment ?? '',
            ...this.getReviewArgs(input.type, input.itemId),
            customerId: customer.id,
        });
        return assertFound(this.findOne(ctx, (newEntity as Review).id));
    }

    async update(ctx: RequestContext, input: UpdateReviewInput) {
        const entity = await this.connection.getEntityOrThrow(ctx, Review, input.id);

        // Blocks editing of `public` if not SuperAdmin
        if (!(await ctx.userHasPermissions([Permission.SuperAdmin]))) {
            delete input.public;
        }

        const updatedEntity = patchEntity(entity, input);
        await this.connection.getRepository(ctx, Review).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, itemId: ID): Promise<DeletionResponse> {
        try {
            await this.connection.getRepository(ctx, Review).softDelete(itemId);
            return {
                result: DeletionResult.DELETED,
            };
        } catch (e: any) {
            console.error('e', e);
            return {
                result: DeletionResult.NOT_DELETED,
                message: e.toString(),
            };
        }
    }

    async addReview(ctx: RequestContext, input: CreateReviewInput): Promise<Review> {
        const customer = await this.getCustomer(ctx);
        // const existingItem = await this.connection.getRepository(ctx, Review).findOne({
        //     where: {
        //         customerId: customer.id,
        //         type: input.type,
        //         ...this.getReviewArgs(input.type, input.itemId),
        //     },
        // });

        // if (existingItem) {
        //     return existingItem;
        // }
        const reviewItem = await this.connection.getRepository(ctx, Review).save({
            type: input.type,
            ...this.getReviewArgs(input.type, input.itemId),
            customerId: customer.id as string,
            sellerId: input.sellerId,
            comment: input.comment ?? '',
            public: input.public ?? true,
            rating: input.rating ?? 0,
        });
        return assertFound(this.findOne(ctx, (reviewItem as Review).id));
    }

    async getReviews<T extends VendureEntity>(
        ctx: RequestContext,
        type: ReviewType,
        data: T[],
    ): Promise<T[]> {
        try {
            if (ctx.apiType !== 'shop' || !ctx.activeUserId) {
                return data.map(item => ({ ...item, reviews: [] }));
            }
            const key: Record<ReviewType, keyof Review> = {
                [ReviewType.BOOKING]: 'bookingId',
                [ReviewType.PRODUCT]: 'productId',
                [ReviewType.SELLER]: 'sellerId',
            };

            const customer = await this.getCustomer(ctx);
            const reviewItems = await this.connection.getRepository(ctx, Review).find({
                where: { customerId: customer.id, type, public: true },
            });

            return data.map(item => {
                const reviews = reviewItems.filter(reviewItem => reviewItem[key[type]] === item.id);
                return { ...item, reviews };
            });
        } catch (e) {
            return data.map(item => ({ ...item, reviews: [] }));
        }
    }

    async getAverageEntityRating(
        ctx: RequestContext,
        entityIds: ID[],
        type: ReviewType,
    ): Promise<{ entityId: ID; rating: number; reviewCount: number }[]> {
        const key: Record<ReviewType, keyof Review> = {
            [ReviewType.BOOKING]: 'bookingId',
            [ReviewType.PRODUCT]: 'productId',
            [ReviewType.SELLER]: 'sellerId',
        };
        const reviews = await this.connection
            .getRepository(ctx, Review)
            .findBy({ [key[type]]: In(entityIds), type: type });
        const ratings = entityIds.map(entityId => {
            const entityReviews = reviews.filter(review => review[key[type]] === entityId) || [];
            const reviewCount = entityReviews.length;
            const rating =
                reviewCount > 0
                    ? entityReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
                    : 0;
            return { entityId, rating, reviewCount };
        });
        return ratings;
    }
}

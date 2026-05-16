import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
import {
    Customer,
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    TranslatorService,
    VendureEntity,
    assertFound,
} from '@vendure/core';
import { IsNull } from 'typeorm';
import { Booking } from '../../booking-plugin/entities/booking.entity';
import { WISHLIST_PLUGIN_OPTIONS } from '../constants';
import { Wishlist, WishlistItemType } from '../entities/wishlist.entity';
import { PluginInitOptions } from '../types';

@Injectable()
export class WishlistService {
    private readonly relations: RelationPaths<Wishlist> = [
        'seller',
        'product',
        'product.variants',
        'booking',
        'booking.form',
        'booking.translations',
    ];
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        private translator: TranslatorService,
        @Inject(WISHLIST_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}
    get WishlistRepo() {
        return this.connection.rawConnection.getRepository(Wishlist);
    }

    private translateEntity(ctx: RequestContext, item?: Booking) {
        if (!item) return undefined;
        const data = this.translator.translate(item, ctx, ['form']);
        return data;
    }

    getWishlistArgs(type: WishlistItemType, itemId: ID) {
        return {
            ...(type === WishlistItemType.SELLER && { sellerId: itemId }),
            ...(type === WishlistItemType.PRODUCT && { productId: itemId }),
            ...(type === WishlistItemType.BOOKING && { bookingId: itemId }),
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

    async findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<Wishlist>,
    ): Promise<Wishlist | undefined> {
        const effectiveRelations = relations ?? this.relations.slice();
        const options = {
            relations: unique(effectiveRelations),
        };

        const wishlist = await this.connection.getEntityOrThrow(ctx, Wishlist, id, options);
        if (wishlist.booking) {
            wishlist.booking = this.translateEntity(ctx, wishlist.booking);
        }

        return wishlist;
    }

    async findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<Wishlist>,
        relations?: RelationPaths<Wishlist>,
    ): Promise<PaginatedList<Wishlist>> {
        const effectiveRelations = relations ?? this.relations.slice();
        const customer = await this.getCustomer(ctx);
        return this.listQueryBuilder
            .build(Wishlist, options, {
                relations: unique(effectiveRelations),
                ctx,
                where: {
                    customerId: customer.id,
                },
            })
            .getManyAndCount()
            .then(([items, totalItems]) => {
                return {
                    items: items.map(item => ({
                        ...item,
                        booking: this.translateEntity(ctx, item.booking),
                    })),
                    totalItems,
                };
            });
    }

    async create(
        ctx: RequestContext,
        input: {
            type: WishlistItemType;
            itemId: ID;
        },
    ) {
        const customer = await this.getCustomer(ctx);
        return this.WishlistRepo.save({
            ...input,
            ...this.getWishlistArgs(input.type, input.itemId),
            customerId: customer.id,
        });
    }

    async delete(ctx: RequestContext, type: WishlistItemType, itemId: ID): Promise<DeletionResponse> {
        try {
            const customer = await this.getCustomer(ctx);
            const existingItem = await this.WishlistRepo.findOne({
                where: {
                    customerId: customer.id,
                    type,
                    ...this.getWishlistArgs(type, itemId),
                },
            });
            if (!existingItem) {
                return {
                    result: DeletionResult.DELETED,
                };
            }
            await this.WishlistRepo.remove(existingItem);
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

    async addToWishlist(ctx: RequestContext, type: WishlistItemType, itemId: ID): Promise<Wishlist> {
        const customer = await this.getCustomer(ctx);
        const existingItem = await this.WishlistRepo.findOne({
            where: {
                customerId: customer.id,
                type,
                ...this.getWishlistArgs(type, itemId),
            },
        });

        if (existingItem) {
            return existingItem;
        }

        const wishlistItem = await this.create(ctx, { type, itemId });
        return assertFound(this.findOne(ctx, wishlistItem.id));
    }

    async getUserWishlistItems<T extends VendureEntity>(
        ctx: RequestContext,
        type: WishlistItemType,
        data: T[],
    ): Promise<T[]> {
        try {
            if (ctx.apiType !== 'shop' || !ctx.activeUserId) {
                return data.map(item => ({ ...item, isFavorite: false }));
            }
            const key: Record<WishlistItemType, keyof Wishlist> = {
                [WishlistItemType.BOOKING]: 'bookingId',
                [WishlistItemType.PRODUCT]: 'productId',
                [WishlistItemType.SELLER]: 'sellerId',
            };

            const customer = await this.getCustomer(ctx);
            const wishlistItems = await this.WishlistRepo.find({
                where: { customerId: customer.id, type },
            });

            return data.map(item => {
                const isFavorite = wishlistItems.some(wishlistItem => wishlistItem[key[type]] === item.id);
                return { ...item, isFavorite };
            });
        } catch (e) {
            return data.map(item => ({ ...item, isFavorite: false }));
        }
    }

    async isFavorite(ctx: RequestContext, type: WishlistItemType, itemId: ID): Promise<boolean> {
        try {
            if (ctx.apiType !== 'shop' || !ctx.activeUserId) {
                return false;
            }
            const customer = await this.getCustomer(ctx);
            return this.WishlistRepo.findOne({
                where: {
                    customerId: customer.id,
                    type,
                    ...this.getWishlistArgs(type, itemId),
                },
            }).then(item => !!item);
        } catch (e) {
            return false;
        }
    }
}

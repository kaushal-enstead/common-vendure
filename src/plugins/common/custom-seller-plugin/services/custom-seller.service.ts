import { Injectable } from '@nestjs/common';
import { unique } from '@vendure/common/lib/unique';
import {
    Administrator,
    Channel,
    ChannelService,
    EventBus,
    ID,
    ListQueryBuilder,
    ListQueryOptions,
    PaginatedList,
    Product,
    ProductVariant,
    RelationPaths,
    RequestContext,
    Role,
    RoleService,
    Seller,
    SellerService,
    TransactionalConnection,
    User,
} from '@vendure/core';
import { IsNull, Not } from 'typeorm';
import { Booking } from '../../booking-plugin/entities/booking.entity';
import { WishlistItemType } from '../../wishlist-plugin/entities/wishlist.entity';
import { WishlistService } from '../../wishlist-plugin/services/wishlist.service';
import { NativeAuthenticationResult, SellerCustomFields } from '../gql/generated';
import { ReviewType } from '../../review-plugin/entities/review.entity';
import { ReviewService } from '../../review-plugin/services/review.service';
import { SellerRejectionEvent, SellerApprovalEvent } from '../events/event-types';

@Injectable()
export class CustomSellerService {
    private readonly relations: RelationPaths<Seller> = [];
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        private channelService: ChannelService,
        private eventBus: EventBus,
        private sellerService: SellerService,
        private wishlistService: WishlistService,
        private reviewService: ReviewService,
        private roleService: RoleService,
    ) {}

    private async getDefaultSellerRole(ctx: RequestContext) {
        const defaultSellerRole = await this.connection
            .getRepository(ctx, Role)
            .findOne({ where: { code: 'shared-seller-role' } });

        if (!defaultSellerRole) throw new Error('Seller role not found');

        return defaultSellerRole;
    }

    private async getSellerUser(ctx: RequestContext, sellerId: string) {
        const seller = await this.findOne(ctx, sellerId, ['channels']);
        if (!seller) throw new Error('Seller not found');

        if (!seller.channels?.length) throw new Error('Seller channels not found');

        const sellerChannel = seller.channels.find(c => c.code !== '__default_channel__');
        if (!sellerChannel) throw new Error('Default or Super Admin Seller cannot be approved or rejected');

        const sellerRole = await this.connection
            .getRepository(ctx, Role)
            .createQueryBuilder('role')
            .innerJoin('role.channels', 'channel')
            .where('channel.id = :channelId', { channelId: sellerChannel.id })
            .andWhere('role.code <> :code', { code: '__super_admin_role__' })
            .getOne();

        if (!sellerRole) throw new Error('Seller role not found');

        return { seller, sellerRole };
    }

    async getServiceCount(ctx: RequestContext, sellerId: ID): Promise<number> {
        const channel = await this.connection
            .getRepository(ctx, Channel)
            .findOne({ where: { sellerId: sellerId } });
        if (!channel) {
            throw new Error('Seller not found');
        }

        const bookingCount = await this.connection
            .getRepository(ctx, Booking)
            .count({ where: { channels: { id: channel.id }, deletedAt: IsNull() } });

        return bookingCount;
    }

    async getProductCount(ctx: RequestContext, sellerId: ID): Promise<number> {
        const channel = await this.connection
            .getRepository(ctx, Channel)
            .findOne({ where: { sellerId: sellerId } });
        if (!channel) {
            throw new Error('Seller not found');
        }

        const productCount = await this.connection
            .getRepository(ctx, Product)
            .count({ where: { channels: { id: channel.id }, deletedAt: IsNull() } });

        return productCount;
    }

    async getVariantCount(ctx: RequestContext, sellerId: ID): Promise<number> {
        const channel = await this.connection
            .getRepository(ctx, Channel)
            .findOne({ where: { sellerId: sellerId } });
        if (!channel) {
            throw new Error('Seller not found');
        }

        const variantCount = await this.connection
            .getRepository(ctx, ProductVariant)
            .count({ where: { channels: { id: channel.id }, deletedAt: IsNull() } });

        return variantCount;
    }

    findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Seller>): Promise<Seller | null> {
        const effectiveRelations = relations ?? this.relations.slice();
        return this.connection.getRepository(ctx, Seller).findOne({
            relations: unique(effectiveRelations),
            where: {
                id,
                deletedAt: IsNull(),
            },
        });
    }

    findSellers(ctx: RequestContext, options: ListQueryOptions<Seller>): Promise<PaginatedList<Seller>> {
        return this.listQueryBuilder
            .build(Seller, options, {
                ctx,
                ...(ctx.channel.code !== '__default_channel__' ? { channelId: ctx.channelId } : {}),
                where: {
                    deletedAt: IsNull(),
                },
            })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<Seller & SellerCustomFields>,
        relations?: RelationPaths<Seller>,
    ): Promise<PaginatedList<Seller>> {
        const effectiveRelations = relations ?? this.relations.slice();
        options = {
            ...options,
            filter: {
                ...options?.filter,
                status: { eq: 'Approved' },
            },
        };
        return this.listQueryBuilder
            .build(Seller, options, {
                relations: unique(effectiveRelations),
                ctx,
                where: {
                    channels: {
                        code: Not('__default_channel__'),
                    },
                },
            })
            .getManyAndCount()
            .then(async ([items, totalItems]) => {
                const sellerIds = items.map(seller => seller.id);
                const averageRatings = await this.reviewService.getAverageEntityRating(
                    ctx,
                    sellerIds,
                    ReviewType.SELLER,
                );
                items = await this.wishlistService.getUserWishlistItems(ctx, WishlistItemType.SELLER, items);
                return {
                    items: items.map(seller => ({
                        ...seller,
                        averageRating:
                            averageRatings.find(rating => rating.entityId === seller.id)?.rating || null,
                    })),
                    totalItems,
                };
            });
    }

    async approve(ctx: RequestContext, sellerId: string): Promise<boolean> {
        const { sellerRole, seller } = await this.getSellerUser(ctx, sellerId);
        const defaultSellerRole = await this.getDefaultSellerRole(ctx);

        // add the default shared-seller-role permissions to the seller
        await this.roleService.update(ctx, {
            id: sellerRole.id,
            permissions: [...sellerRole.permissions, ...defaultSellerRole.permissions],
        });

        // update the seller status to Approved
        await this.sellerService.update(ctx, { id: sellerId, customFields: { status: 'Approved' } });

        // Attach EasyPay accountId if exists
        const sellerGatewayId = seller?.customFields?.connectedAccountId;
        if (sellerGatewayId) {
            await this.attachEasyPayAccountId(ctx, sellerId, sellerGatewayId);
        }

        if (seller.customFields?.contact?.contactEmail) {
            this.eventBus.publish(
                new SellerApprovalEvent(ctx, sellerId, seller.name, seller.customFields.contact.contactEmail),
            );
        }
        return true;
    }

    private async attachEasyPayAccountId(
        ctx: RequestContext,
        sellerId: string,
        accountId: string,
    ): Promise<void> {
        await this.sellerService.update(ctx, {
            id: sellerId,
            customFields: {
                connectedAccountId: accountId,
            },
        });
    }

    async reject(ctx: RequestContext, sellerId: string, reason: string): Promise<boolean> {
        const { sellerRole, seller } = await this.getSellerUser(ctx, sellerId);
        const defaultSellerRole = await this.getDefaultSellerRole(ctx);

        // remove the default shared-seller-role permissions from the seller
        await this.roleService.update(ctx, {
            id: sellerRole.id,
            permissions: sellerRole.permissions.filter(p => !defaultSellerRole.permissions.includes(p)),
        });

        // update the seller status to Disapproved
        await this.sellerService.update(ctx, {
            id: sellerId,
            customFields: {
                rejectReason: reason,
                status: 'Disapproved',
            },
        });

        if (seller.customFields?.contact?.contactEmail) {
            this.eventBus.publish(
                new SellerRejectionEvent(
                    ctx,
                    sellerId,
                    seller.name,
                    seller.customFields.contact.contactEmail,
                    reason,
                ),
            );
        }

        return true;
    }

    async login(ctx: RequestContext, email: string, password: string): Promise<NativeAuthenticationResult> {
        const admin = await this.connection.getRepository(ctx, Administrator).findOne({
            where: { emailAddress: email },
        });

        if (!admin) {
            throw new Error('errorResult.INVALID_CREDENTIALS_ERROR');
        }

        const user = await this.connection.getRepository(ctx, User).findOne({
            where: { id: admin.user.id },
        });

        if (!user) {
            throw new Error('errorResult.INVALID_CREDENTIALS_ERROR');
        }

        // if (!user) {
        //   throw new Error("Invalid credentials");
        // }

        // const customFields = seller.customFields;

        // // Verifica o estado de aprovação
        // if (customFields.status !== "Approved") {
        //   throw new Error("Seller is not approved yet");
        // }

        // // // Validação da password
        // // if (customFields.password !== password) {
        // //   throw new Error("Invalid credentials");
        // // }

        return {
            __typename: 'CurrentUser',
            id: user.id.toString(), // Convertendo o ID para string
            identifier: email || '',
            channels: [],
        };
    }
}

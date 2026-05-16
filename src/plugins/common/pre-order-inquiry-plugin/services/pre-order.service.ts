import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    assertFound,
    patchEntity,
    Order,
    Customer,
    ProductVariant,
    ChannelService,
    CustomerService,
    OrderService,
    OrderLimitError,
    OrderModificationError,
    NegativeQuantityError,
    idsAreEqual,
    InsufficientStockError,
    OrderInterceptorError,
} from '@vendure/core';
import { In, IsNull } from 'typeorm';
import { PRE_ORDER_INQUIRY_PLUGIN_OPTIONS } from '../constants';
import { EPreOrderStatus, PreOrder } from '../entities/pre-order.entity';
import { PluginInitOptions } from '../types';
import { CreatePreOrderInput, UpdatePreOrderInput } from '../gql/generated';
import { unique } from '@vendure/common/lib/unique';

@Injectable()
export class PreOrderService {
    private readonly relations: RelationPaths<PreOrder> = [
        'productVariant',
        'productVariant.featuredAsset',
        'productVariant.product',
        'productVariant.product.featuredAsset',
        'productVariant.channels',
        'customer',
    ];
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        @Inject(PRE_ORDER_INQUIRY_PLUGIN_OPTIONS) private options: PluginInitOptions,
        private channelService: ChannelService,
        private customUserService: CustomerService,
        private orderService: OrderService,
    ) {}

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

    async findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<PreOrder>,
        relations?: RelationPaths<PreOrder>,
    ): Promise<PaginatedList<PreOrder>> {
        const effectiveRelations = unique([...(relations ?? []), ...this.relations]);

        const qb = this.listQueryBuilder.build(PreOrder, options ?? {}, {
            ctx,
            relations: effectiveRelations,
            channelId: ctx.channelId,
            where: {
                deletedAt: IsNull(),
            },
        });

        const [items, totalItems] = await qb.getManyAndCount();
        return { items, totalItems };
    }

    async findMyPreOrders(
        ctx: RequestContext,
        options?: ListQueryOptions<PreOrder>,
        relations?: RelationPaths<PreOrder>,
    ): Promise<PaginatedList<PreOrder>> {
        const effectiveRelations = unique([...(relations ?? []), ...this.relations]);
        const customer = await this.getCustomer(ctx);
        const qb = this.listQueryBuilder.build(PreOrder, options ?? {}, {
            ctx,
            relations: effectiveRelations,
            where: {
                customerId: customer.id.toString(),
                deletedAt: IsNull(),
                status: In([
                    EPreOrderStatus.PENDING,
                    EPreOrderStatus.ACCEPTED,
                    EPreOrderStatus.CHANGE_PROPOSED,
                    EPreOrderStatus.REFUSED,
                ]),
            },
        });

        const [items, totalItems] = await qb.getManyAndCount();
        return { items, totalItems };
    }

    findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<PreOrder>): Promise<PreOrder | null> {
        return this.connection.getRepository(ctx, PreOrder).findOne({ where: { id }, relations });
    }

    async create(ctx: RequestContext, input: CreatePreOrderInput): Promise<PreOrder> {
        const customer = await this.getCustomer(ctx);

        const variant = await this.connection.getEntityOrThrow(ctx, ProductVariant, input.productVariantId, {
            relations: ['product', 'channels'],
        });
        const preOrder = new PreOrder({
            quantity: input.quantity,
            customerId: customer.id,
            productVariant: variant,
            message: input.message,
        });
        const saved = await this.connection.getRepository(ctx, PreOrder).save(preOrder);

        if (!variant?.channels?.length) {
            throw new Error('This product is not assigned to any channel');
        }
        if (variant.channels.length < 2) {
            throw new Error('This product is not assigned to any channel');
        }

        const defaultChannel = variant.channels.find(c => c.code === '__default_channel__');
        if (!defaultChannel) {
            throw new Error('Could not find a default channel for this product');
        }

        if (variant.channels.length > 1) {
            const sellerChannel = variant.channels.find(c => !idsAreEqual(c.id, defaultChannel.id));
            if (!sellerChannel) {
                throw new Error('Could not find a seller channel for this product');
            }

            await this.channelService.assignToChannels(ctx, PreOrder, saved.id, [
                sellerChannel.id,
                defaultChannel.id,
            ]);
        }

        return assertFound(this.findOne(ctx, saved.id));
    }

    async update(ctx: RequestContext, input: UpdatePreOrderInput): Promise<PreOrder> {
        const entity = await this.connection.getEntityOrThrow(ctx, PreOrder, input.id);
        await this.connection.getRepository(ctx, PreOrder).save(
            patchEntity(entity, {
                ...input,
                acceptedAt: input.status === EPreOrderStatus.ACCEPTED ? new Date() : null,
            }),
            { reload: false },
        );
        return assertFound(this.findOne(ctx, entity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        try {
            await this.connection.getRepository(ctx, PreOrder).softDelete(id);
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

    async acceptPreOrder(ctx: RequestContext, id: ID): Promise<boolean> {
        const entity = await this.connection.getEntityOrThrow(ctx, PreOrder, id);

        if (entity.status === EPreOrderStatus.CUSTOMER_ACCEPTED) {
            throw new Error('PreOrder already accepted by customer');
        }

        if (entity.status === EPreOrderStatus.COMPLETED) {
            throw new Error('PreOrder already completed');
        }

        entity.acceptedAt = new Date();
        entity.status = EPreOrderStatus.ACCEPTED;
        await this.connection.getRepository(ctx, PreOrder).save(entity);
        return true;
    }

    async convertToOrder(ctx: RequestContext, id: ID): Promise<Order> {
        const entity = await this.connection.getEntityOrThrow(ctx, PreOrder, id);

        if (![EPreOrderStatus.ACCEPTED, EPreOrderStatus.CHANGE_PROPOSED].includes(entity.status)) {
            throw new Error('PreOrder not accepted');
        }

        const customer = await this.customUserService.findOne(ctx, entity.customerId, ['user']);
        if (!customer?.user?.id) {
            throw new Error('Customer not found');
        }

        // 1. Get active order for user
        let order = await this.orderService.getActiveOrderForUser(ctx, customer.user.id);
        if (!order) {
            // 2. If no order, create one
            order = await this.orderService.create(ctx, customer.user.id);
        }

        await this.orderService.transitionToState(ctx, order.id, 'AddingItems');
        // 3. Add item to the order, that is converted from pre-order
        const data = await this.orderService.addItemToOrder(
            ctx,
            order.id,
            entity.productVariant.id,
            entity.quantity,
            { preOrderId: entity.id },
        );

        switch (true) {
            case data instanceof Order:
                // 4. Mark pre-order as accepted from customer
                entity.status = EPreOrderStatus.CUSTOMER_ACCEPTED;
                await this.connection.getRepository(ctx, PreOrder).save(entity);
                return order;

            case data instanceof OrderModificationError:
            case data instanceof OrderLimitError:
            case data instanceof NegativeQuantityError:
            case data instanceof InsufficientStockError:
            case data instanceof OrderInterceptorError:
                throw new Error(data.message);
        }

        throw new Error('Error converting pre-order to order');
    }

    async markAsCompleted(ctx: RequestContext, id: ID): Promise<void> {
        await this.connection.getRepository(ctx, PreOrder).update(id, {
            status: EPreOrderStatus.COMPLETED,
        });
    }

    async cancelPreOrder(ctx: RequestContext, id: ID): Promise<boolean> {
        const entity = await this.connection.getEntityOrThrow(ctx, PreOrder, id);
        await this.connection.getRepository(ctx, PreOrder).softDelete(id);
        return true;
    }
}

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
    assertFound,
    patchEntity,
} from '@vendure/core';
import { In, IsNull } from 'typeorm';
import { BOOKING_PLUGIN_OPTIONS } from '../constants';
import { BookingOrder } from '../entities/booking-order.entity';
import { Booking } from '../entities/booking.entity';
import { AddOrderCommentInput, CreateBookingOrderInput, UpdateBookingOrderInput } from '../gql/generated';
import { PluginInitOptions } from '../types';

@Injectable()
export class BookingOrderService {
    private readonly relations: RelationPaths<BookingOrder> = [
        'booking',
        'booking.form.fields',
        'booking.assets',
        'booking.featuredAsset',
        'customer',
        'customer.addresses',
        'customer.user',
    ];
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        private translator: TranslatorService,
        @Inject(BOOKING_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    private translateEntity(item: BookingOrder, ctx: RequestContext) {
        item.booking = this.translator.translate(item.booking, ctx, ['form', ['form', 'fields']]);
        return item;
    }

    async findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<BookingOrder>,
        relations?: RelationPaths<BookingOrder>,
    ): Promise<PaginatedList<BookingOrder>> {
        const effectiveRelations = relations ?? this.relations.slice();
        let bookingIds: readonly ID[] = [];

        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: {
                deletedAt: IsNull(),
                user: { id: ctx.activeUserId },
            },
        });

        if (!customer) {
            const bookings = await this.connection
                .getRepository(ctx, Booking)
                .createQueryBuilder('b')
                .innerJoin('b.channels', 'bc')
                .where('bc.id = :channelId', { channelId: ctx.channelId })
                .select('b.id', 'id')
                .getRawMany<Booking>();
            bookingIds = bookings.map(b => b.id);
        }
        // else {
        //   const orders = await this.connection
        //     .getRepository(ctx, BookingOrder)
        //     .find({ where: { customerId: ctx.activeUserId } });
        //   bookingIds = orders.map((b) => b.bookingId);
        // }

        return this.listQueryBuilder
            .build(BookingOrder, options, {
                relations: effectiveRelations,
                where: {
                    deletedAt: IsNull(),
                    ...(customer ? { customerId: customer.id } : { bookingId: In(bookingIds) }),
                },
                ctx,
            })
            .getManyAndCount()
            .then(([items, totalItems]) => {
                return {
                    items: items.map(item => {
                        item.booking.assets = item.booking.assets
                            ?.map(a => a.asset as never)
                            ?.filter(Boolean);
                        return this.translateEntity(item, ctx);
                    }),
                    totalItems,
                };
            });
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<BookingOrder>,
    ): Promise<BookingOrder | null> {
        const effectiveRelations = relations ?? this.relations.slice();
        return this.connection
            .getRepository(ctx, BookingOrder)
            .findOne({
                relations: unique(effectiveRelations),
                where: {
                    id,
                    deletedAt: IsNull(),
                },
            })
            .then(entity => {
                if (!entity) return null;
                entity.booking.assets = entity.booking.assets?.map(a => a.asset)?.filter(Boolean) as never;
                return this.translateEntity(entity, ctx);
            });
    }

    async create(ctx: RequestContext, input: CreateBookingOrderInput): Promise<BookingOrder> {
        const request = new BookingOrder(input);
        if (!request.comments) {
            request.comments = [];
        }

        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: { deletedAt: IsNull(), user: { id: ctx.activeUserId } },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        request.customer = customer;

        request.booking = await this.connection.getEntityOrThrow(ctx, Booking, input.bookingId);
        if (!request.booking) {
            throw new Error('Booking not found');
        }

        const newEntity = await this.connection.getRepository(ctx, BookingOrder).save(request);
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateBookingOrderInput): Promise<BookingOrder> {
        const entity = await this.connection.getEntityOrThrow(ctx, BookingOrder, input.id);
        const request = new BookingOrder(input);
        const updatedEntity = patchEntity(entity, request);
        await this.connection.getRepository(ctx, BookingOrder).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async addComment(ctx: RequestContext, input: AddOrderCommentInput): Promise<BookingOrder> {
        const entity = await this.connection.getEntityOrThrow(ctx, BookingOrder, input.id);
        if (input.comment) {
            entity.comments.push(input.comment as never);
        }
        const updatedEntity = patchEntity(entity, input);
        await this.connection.getRepository(ctx, BookingOrder).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, BookingOrder, id);
        try {
            await this.connection.getRepository(ctx, BookingOrder).remove(entity);
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
}

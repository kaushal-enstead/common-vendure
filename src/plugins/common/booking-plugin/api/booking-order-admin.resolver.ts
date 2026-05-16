import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse, Permission } from '@vendure/common/lib/generated-types';
import {
    Allow,
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    RelationPaths,
    Relations,
    RequestContext,
    Transaction,
} from '@vendure/core';
import { BookingOrder } from '../entities/booking-order.entity';
import { AddOrderCommentInput, CreateBookingOrderInput, UpdateBookingOrderInput } from '../gql/generated';
import { BookingOrderService } from '../services/booking-order.service';

@Resolver()
export class BookingOrderAdminResolver {
    constructor(private bookingOrderService: BookingOrderService) {}

    @Query()
    @Allow(Permission.Authenticated)
    async bookingOrder(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(BookingOrder) relations: RelationPaths<BookingOrder>,
    ): Promise<BookingOrder | null> {
        return this.bookingOrderService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Authenticated)
    async bookingOrders(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<BookingOrder> },
        @Relations(BookingOrder) relations: RelationPaths<BookingOrder>,
    ): Promise<PaginatedList<BookingOrder>> {
        return this.bookingOrderService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async createBookingOrder(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateBookingOrderInput },
    ): Promise<BookingOrder> {
        return this.bookingOrderService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async addOrderComment(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: AddOrderCommentInput },
    ): Promise<BookingOrder> {
        return this.bookingOrderService.addComment(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async updateBookingOrder(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateBookingOrderInput },
    ): Promise<BookingOrder> {
        return this.bookingOrderService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async deleteBookingOrder(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
    ): Promise<DeletionResponse> {
        return this.bookingOrderService.delete(ctx, args.id);
    }
}

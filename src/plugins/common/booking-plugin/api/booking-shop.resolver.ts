import { Args, Query, Resolver } from '@nestjs/graphql';
import {
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    RelationPaths,
    Relations,
    RequestContext,
} from '@vendure/core';
import { Booking } from '../entities/booking.entity';
import { BookingService } from '../services/booking.service';

@Resolver()
export class BookingShopResolver {
    constructor(private bookingService: BookingService) {}

    @Query()
    async service(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(Booking) relations: RelationPaths<Booking>,
    ): Promise<Booking | undefined> {
        return this.bookingService.findOne(ctx, args.id, relations);
    }

    @Query()
    async services(
        @Ctx() ctx: RequestContext,
        @Args()
        args: {
            sellerId: ID;
            options?: ListQueryOptions<Booking>;
            facetValueIds: [ID];
        },
        @Relations(Booking) relations: RelationPaths<Booking>,
    ): Promise<PaginatedList<Booking>> {
        return this.bookingService.findAllBySellerId(ctx, args, relations);
    }
}

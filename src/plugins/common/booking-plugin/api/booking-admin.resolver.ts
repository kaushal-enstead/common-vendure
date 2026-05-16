import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '@vendure/common/lib/generated-types';
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
  Permission,
} from '@vendure/core';
import { Booking } from '../entities/booking.entity';
import { CreateBookingInput, MutationQueryRunnerArgs, UpdateBookingInput } from '../gql/generated';
import { BookingService } from '../services/booking.service';
import { bookingPermissions } from '../constants';

@Resolver()
export class BookingAdminResolver {
  constructor(private bookingService: BookingService) {}

  @Query()
  @Allow(Permission.SuperAdmin, bookingPermissions.Read)
  async booking(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Booking) relations: RelationPaths<Booking>,
  ): Promise<Booking | undefined> {
    return this.bookingService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.SuperAdmin, bookingPermissions.Read)
  async bookings(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Booking> },
    @Relations(Booking) relations: RelationPaths<Booking>,
  ): Promise<PaginatedList<Booking>> {
    return this.bookingService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.SuperAdmin, bookingPermissions.Create)
  async createBooking(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateBookingInput },
  ): Promise<Booking> {
    return this.bookingService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.SuperAdmin, bookingPermissions.Update)
  async updateBooking(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateBookingInput },
  ): Promise<Booking> {
    return this.bookingService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.SuperAdmin, bookingPermissions.Delete)
  async deleteBooking(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.bookingService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.SuperAdmin, bookingPermissions.Delete)
  async deleteBookings(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.bookingService.delete(ctx, id)));
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.SuperAdmin)
  async queryRunner(@Ctx() ctx: RequestContext, @Args() args: MutationQueryRunnerArgs): Promise<string> {
    return this.bookingService.queryRunner(ctx, args);
  }
}

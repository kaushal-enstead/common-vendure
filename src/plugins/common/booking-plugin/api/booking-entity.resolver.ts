import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, Seller } from '@vendure/core';
import { ReviewService } from '../../review-plugin/services/review.service';
import { ReviewType } from '../../review-plugin/entities/review.entity';
import { Booking } from '../entities/booking.entity';
import { BookingService } from '../services/booking.service';
@Resolver('Booking')
export class BookingEntityResolver {
    constructor(
        private reviewService: ReviewService,
        private bookingService: BookingService,
    ) {}

    @ResolveField()
    async averageRating(@Ctx() ctx: RequestContext, @Parent() booking: Booking): Promise<number | null> {
        if (booking?.averageRating !== undefined) {
            return booking.averageRating;
        }

        const ratings = await this.reviewService.getAverageEntityRating(
            ctx,
            [booking.id],
            ReviewType.BOOKING,
        );
        booking.reviewCount = ratings[0]?.reviewCount || null;
        booking.averageRating = ratings[0]?.rating || null;
        return ratings[0]?.rating || null;
    }

    @ResolveField()
    async reviewCount(@Ctx() ctx: RequestContext, @Parent() booking: Booking): Promise<number | null> {
        if (booking?.reviewCount !== undefined) {
            return booking.reviewCount;
        }

        const ratings = await this.reviewService.getAverageEntityRating(
            ctx,
            [booking.id],
            ReviewType.BOOKING,
        );
        booking.reviewCount = ratings[0]?.reviewCount || null;
        booking.averageRating = ratings[0]?.rating || null;
        return ratings[0]?.reviewCount || null;
    }

    @ResolveField()
    async seller(@Ctx() ctx: RequestContext, @Parent() booking: Booking): Promise<Seller | undefined> {
        if (booking?.seller !== undefined) {
            return booking.seller;
        }
        const bookingData = await this.bookingService.findOne(ctx, booking.id, [
            'channels',
            'channels.seller',
        ]);
        const channel = bookingData?.channels?.find(channel => channel.code !== '__default_channel__');

        if (!channel?.seller) {
            throw new Error(`No seller found for booking ${booking.id}`);
        }

        return channel.seller;
    }
}

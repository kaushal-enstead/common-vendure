import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '../gql/generated';
import {
    Allow,
    Ctx,
    ListQueryOptions,
    PaginatedList,
    Permission,
    RelationPaths,
    Relations,
    RequestContext,
} from '@vendure/core';
import { Review } from '../entities/review.entity';
import { ReviewService } from '../services/review.service';
import { CreateReviewInput, UpdateReviewInput } from '../gql/generated';

@Resolver()
export class ReviewResolver {
    constructor(private reviewService: ReviewService) {}

    @Query()
    @Allow(Permission.Public)
    async review(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: string },
        @Relations(Review) relations: RelationPaths<Review>,
    ): Promise<Review | undefined> {
        return this.reviewService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async reviews(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Review> },
        @Relations(Review) relations: RelationPaths<Review>,
    ): Promise<PaginatedList<Review>> {
        return this.reviewService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Allow(Permission.Public)
    async createReview(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateReviewInput },
    ): Promise<Review> {
        return this.reviewService.addReview(ctx, args.input);
    }

    @Mutation()
    @Allow(Permission.SuperAdmin)
    async updateReview(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateReviewInput },
    ): Promise<Review> {
        return this.reviewService.update(ctx, args.input);
    }

    @Mutation()
    @Allow(Permission.Public)
    async deleteReviews(
        @Ctx() ctx: RequestContext,
        @Args() args: { ids: string[] },
    ): Promise<DeletionResponse[]> {
        return Promise.all(args.ids.map(id => this.reviewService.delete(ctx, id)));
    }

    @Mutation()
    @Allow(Permission.Public)
    async deleteReview(@Ctx() ctx: RequestContext, @Args() args: { id: string }): Promise<DeletionResponse> {
        return this.reviewService.delete(ctx, args.id);
    }
}

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
  Translated,
} from '@vendure/core';
import { Faq } from '../../entities/faq/faq.entity';
import { FaqService } from '../../services/faq.service';
import {
  CreateFaqInput,
  UpdateFaqInput,
  AssignFaqsToChannelInput,
  RemoveFaqsFromChannelInput,
  Permission,
} from '../../gql/generated';

@Resolver()
export class FaqAdminResolver {
  constructor(private faqService: FaqService) {}

  @Query()
  @Allow(Permission.ReadFaq)
  async faq(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Faq) relations: RelationPaths<Faq>,
  ): Promise<Translated<Faq> | null> {
    return this.faqService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadFaq)
  async faqs(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Faq> },
    @Relations(Faq) relations: RelationPaths<Faq>,
  ): Promise<PaginatedList<Translated<Faq>>> {
    return this.faqService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreateFaq)
  async createFaq(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateFaqInput },
  ): Promise<Translated<Faq>> {
    return this.faqService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdateFaq)
  async updateFaq(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateFaqInput },
  ): Promise<Translated<Faq>> {
    return this.faqService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteFaq)
  async deleteFaq(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.faqService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteFaq)
  async deleteFaqs(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.faqService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateFaq)
  async assignFaqsToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignFaqsToChannelInput },
  ): Promise<Array<Translated<Faq>>> {
    return this.faqService.assignFaqsToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateFaq)
  async removeFaqsFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveFaqsFromChannelInput },
  ): Promise<Array<Translated<Faq>>> {
    return this.faqService.removeFaqsFromChannel(ctx, args.input);
  }
}

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
} from '@vendure/core';
import { Page } from '../../entities/page-builder/page.entity';
import { PageBuilderService } from '../../services/page-builder.service';
import {
  Permission,
  CreatePageInput,
  UpdatePageInput,
  AssignPageToChannelInput,
  RemovePageFromChannelInput,
} from '../../gql/generated';

@Resolver()
export class PageAdminResolver {
  constructor(private pageBuilderService: PageBuilderService) {}

  @Query()
  @Allow(Permission.ReadPage)
  async page(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Page) relations: RelationPaths<Page>,
  ): Promise<Page | null> {
    return this.pageBuilderService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadPage)
  async pageList(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Page> },
    @Relations(Page) relations: RelationPaths<Page>,
  ): Promise<PaginatedList<Page>> {
    return this.pageBuilderService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreatePage)
  async createPage(@Ctx() ctx: RequestContext, @Args() args: { input: CreatePageInput }): Promise<Page> {
    return this.pageBuilderService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdatePage)
  async updatePage(@Ctx() ctx: RequestContext, @Args() args: { input: UpdatePageInput }): Promise<Page> {
    return this.pageBuilderService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeletePage)
  async deletePage(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.pageBuilderService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeletePage)
  async deletePageList(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.pageBuilderService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdatePage)
  async assignPageToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignPageToChannelInput },
  ): Promise<Array<Page>> {
    return this.pageBuilderService.assignPageToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdatePage)
  async removePageFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemovePageFromChannelInput },
  ): Promise<Array<Page>> {
    return this.pageBuilderService.removePageFromChannel(ctx, args.input);
  }
}

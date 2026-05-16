import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '@vendure/common/lib/generated-types';
import { Allow, Ctx, ID, RequestContext, Transaction } from '@vendure/core';
import { PageBlock } from '../../entities/page-builder/page-block.entity';
import { PageBlockService } from '../../services/page-block.service';
import { Permission, CreatePageBlockInput, UpdatePageBlockInput } from '../../gql/generated';

@Resolver()
export class PageBlockAdminResolver {
  constructor(private pageBlockService: PageBlockService) {}

  @Query()
  @Allow(Permission.ReadPage)
  async pageBlock(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<PageBlock | null> {
    return this.pageBlockService.findOne(ctx, args.id);
  }

  @Query()
  @Allow(Permission.ReadPage)
  async pageBlocks(@Ctx() ctx: RequestContext, @Args() args: { pageId: ID }): Promise<PageBlock[]> {
    return this.pageBlockService.findByPageId(ctx, args.pageId);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdatePage)
  async createPageBlock(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreatePageBlockInput },
  ): Promise<PageBlock> {
    return this.pageBlockService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdatePage)
  async updatePageBlock(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdatePageBlockInput },
  ): Promise<PageBlock> {
    return this.pageBlockService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdatePage)
  async deletePageBlock(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.pageBlockService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdatePage)
  async reorderPageBlocks(
    @Ctx() ctx: RequestContext,
    @Args() args: { blockIds: ID[] },
  ): Promise<PageBlock[]> {
    return this.pageBlockService.reorder(ctx, args.blockIds);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdatePage)
  async duplicatePageBlock(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<PageBlock> {
    return this.pageBlockService.duplicate(ctx, args.id);
  }
}

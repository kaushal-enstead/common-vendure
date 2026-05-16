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
import { Footer } from '../../entities/footer/footer.entity';
import { FooterService } from '../../services/footer.service';
import {
  CreateFooterInput,
  UpdateFooterInput,
  AssignFootersToChannelInput,
  RemoveFootersFromChannelInput,
  Permission,
} from '../../gql/generated';

@Resolver()
export class FooterAdminResolver {
  constructor(private footerService: FooterService) {}

  @Query()
  @Allow(Permission.ReadFooter)
  async footer(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Footer) relations: RelationPaths<Footer>,
  ): Promise<Translated<Footer> | null> {
    return this.footerService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadFooter)
  async footers(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Footer> },
    @Relations(Footer) relations: RelationPaths<Footer>,
  ): Promise<PaginatedList<Translated<Footer>>> {
    return this.footerService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreateFooter)
  async createFooter(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateFooterInput },
  ): Promise<Translated<Footer>> {
    return this.footerService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdateFooter)
  async updateFooter(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateFooterInput },
  ): Promise<Translated<Footer>> {
    return this.footerService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteFooter)
  async deleteFooter(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.footerService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteFooter)
  async deleteFooters(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.footerService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateFooter)
  async assignFootersToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignFootersToChannelInput },
  ): Promise<Array<Translated<Footer>>> {
    return this.footerService.assignFootersToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateFooter)
  async removeFootersFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveFootersFromChannelInput },
  ): Promise<Array<Translated<Footer>>> {
    return this.footerService.removeFootersFromChannel(ctx, args.input);
  }
}

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
import { Header } from '../../entities/header/header.entity';
import { HeaderService } from '../../services/header.service';
import {
  CreateHeaderInput,
  UpdateHeaderInput,
  AssignHeadersToChannelInput,
  RemoveHeadersFromChannelInput,
  Permission,
} from '../../gql/generated';

@Resolver()
export class HeaderAdminResolver {
  constructor(private headerService: HeaderService) {}

  @Query()
  @Allow(Permission.ReadHeader)
  async header(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Header) relations: RelationPaths<Header>,
  ): Promise<Translated<Header> | null> {
    return this.headerService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadHeader)
  async headers(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Header> },
    @Relations(Header) relations: RelationPaths<Header>,
  ): Promise<PaginatedList<Translated<Header>>> {
    return this.headerService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreateHeader)
  async createHeader(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateHeaderInput },
  ): Promise<Translated<Header>> {
    return this.headerService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdateHeader)
  async updateHeader(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateHeaderInput },
  ): Promise<Translated<Header>> {
    return this.headerService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteHeader)
  async deleteHeader(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.headerService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteHeader)
  async deleteHeaders(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.headerService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateHeader)
  async assignHeadersToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignHeadersToChannelInput },
  ): Promise<Array<Translated<Header>>> {
    return this.headerService.assignHeadersToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateHeader)
  async removeHeadersFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveHeadersFromChannelInput },
  ): Promise<Array<Translated<Header>>> {
    return this.headerService.removeHeadersFromChannel(ctx, args.input);
  }
}

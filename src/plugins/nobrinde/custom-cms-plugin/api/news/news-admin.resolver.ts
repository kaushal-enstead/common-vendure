import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
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
import { News } from '../../entities/news/news.entity';
import { NewsService } from '../../services/news.service';
import {
  CreateNewsInput,
  UpdateNewsInput,
  AssignNewsToChannelInput,
  RemoveNewsFromChannelInput,
  Permission,
} from '../../gql/generated';
import { NewsPermissions } from '../../constants';
@Resolver()
export class NewsAdminResolver {
  constructor(private newsService: NewsService) {}

  @Query()
  @Allow(NewsPermissions.Read)
  async news(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(News) relations: RelationPaths<News>,
  ): Promise<Translated<News> | null> {
    return this.newsService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(NewsPermissions.Read)
  async newsList(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<News> },
    @Relations(News) relations: RelationPaths<News>,
  ): Promise<PaginatedList<Translated<News>>> {
    return this.newsService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(NewsPermissions.Create)
  async createNews(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateNewsInput },
  ): Promise<Translated<News>> {
    return this.newsService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(NewsPermissions.Update)
  async updateNews(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateNewsInput },
  ): Promise<Translated<News>> {
    return this.newsService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(NewsPermissions.Delete)
  async deleteNews(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.newsService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(NewsPermissions.Delete)
  async deleteNewsList(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.newsService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(NewsPermissions.Update)
  async assignNewsToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignNewsToChannelInput },
  ): Promise<Array<Translated<News>>> {
    return this.newsService.assignNewsToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(NewsPermissions.Update)
  async removeNewsFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveNewsFromChannelInput },
  ): Promise<Array<Translated<News>>> {
    return this.newsService.removeNewsFromChannel(ctx, args.input);
  }
}

@Resolver('News')
export class NewsAdminEntityResolver {
  constructor(private newsService: NewsService) {}
  @ResolveField()
  async relatedNews(@Ctx() ctx: RequestContext, @Parent() news: News): Promise<Array<Translated<News>>> {
    if (!news.relatedNewsIds || news.relatedNewsIds.length === 0) {
      return [];
    }
    return this.newsService.findByIds(ctx, news.relatedNewsIds);
  }
}

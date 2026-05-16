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
import { Banner } from '../../entities/banner/banner.entity';
import { BannerService } from '../../services/banner.service';
import {
  CreateBannerInput,
  UpdateBannerInput,
  AssignBannersToChannelInput,
  RemoveBannersFromChannelInput,
  Permission,
} from '../../gql/generated';
import { BannerPermissions } from '../../constants';
@Resolver()
export class BannerAdminResolver {
  constructor(private bannerService: BannerService) {}

  @Query()
  @Allow(BannerPermissions.Read)
  async banner(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Banner) relations: RelationPaths<Banner>,
  ): Promise<Translated<Banner> | null> {
    return this.bannerService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(BannerPermissions.Read)
  async banners(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Banner> },
    @Relations(Banner) relations: RelationPaths<Banner>,
  ): Promise<PaginatedList<Translated<Banner>>> {
    return this.bannerService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(BannerPermissions.Create)
  async createBanner(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateBannerInput },
  ): Promise<Translated<Banner>> {
    return this.bannerService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(BannerPermissions.Update)
  async updateBanner(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateBannerInput },
  ): Promise<Translated<Banner>> {
    return this.bannerService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(BannerPermissions.Delete)
  async deleteBanner(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.bannerService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(BannerPermissions.Delete)
  async deleteBanners(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.bannerService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(BannerPermissions.Update)
  async assignBannersToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignBannersToChannelInput },
  ): Promise<Array<Translated<Banner>>> {
    return this.bannerService.assignBannersToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(BannerPermissions.Update)
  async removeBannersFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveBannersFromChannelInput },
  ): Promise<Array<Translated<Banner>>> {
    return this.bannerService.removeBannersFromChannel(ctx, args.input);
  }
}

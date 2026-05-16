import { Args, Query, Resolver } from '@nestjs/graphql';
import { Permission } from '@vendure/common/lib/generated-types';
import { Allow, Ctx, RequestContext } from '@vendure/core';
import { GeoAnalyticsService } from '../services/geoanalitycs.service';
import {
  GeoActivityData,
  GeoLabelsAndData,
  GeoStatsData,
  GeoVisitsPerHour,
  QueryGeoActivityArgs,
  QueryGeoCurrentActivityArgs,
  QueryGeoDurationsArgs,
  QueryGeoLastMonthActivityArgs,
  QueryGeoOriginsArgs,
  QueryVisitsPerHourArgs,
} from '../gql/generated';

@Resolver()
export class GeoAnalyticsAdminResolver {
  constructor(private service: GeoAnalyticsService) {}

  @Query()
  @Allow(Permission.SuperAdmin, Permission.Authenticated, Permission.Public)
  async geoCurrentActivity(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryGeoCurrentActivityArgs,
  ): Promise<GeoStatsData> {
    return this.service.geoMonthlyActivity(ctx, args.input, 'current');
  }

  @Query()
  @Allow(Permission.SuperAdmin, Permission.Authenticated, Permission.Public)
  async geoLastMonthActivity(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryGeoLastMonthActivityArgs,
  ): Promise<GeoStatsData> {
    return this.service.geoMonthlyActivity(ctx, args.input, 'previous');
  }

  @Query()
  @Allow(Permission.SuperAdmin, Permission.Authenticated, Permission.Public)
  async visitsPerHour(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryVisitsPerHourArgs,
  ): Promise<GeoVisitsPerHour> {
    return this.service.visitsPerHour(ctx, args.input);
  }

  @Query()
  @Allow(Permission.SuperAdmin, Permission.Authenticated, Permission.Public)
  async geoOrigins(@Ctx() ctx: RequestContext, @Args() args: QueryGeoOriginsArgs): Promise<GeoLabelsAndData> {
    return this.service.geoOrigins(ctx, args.input);
  }

  @Query()
  @Allow(Permission.SuperAdmin, Permission.Authenticated, Permission.Public)
  async geoDurations(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryGeoDurationsArgs,
  ): Promise<GeoLabelsAndData> {
    return this.service.geoDurations(ctx, args.input);
  }

  @Query()
  @Allow(Permission.SuperAdmin, Permission.Authenticated, Permission.Public)
  async geoActivity(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryGeoActivityArgs,
  ): Promise<GeoActivityData> {
    return this.service.geoActivity(ctx, args.input);
  }
}

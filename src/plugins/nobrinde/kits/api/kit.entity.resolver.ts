import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { DEFAULT_CHANNEL_CODE } from '@vendure/common/lib/shared-constants';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import { KitVariantService } from '../services/kit-variant.service';
import {
  Api,
  ApiType,
  Asset,
  AssetService,
  Channel,
  Collection,
  Ctx,
  FacetValue,
  FacetValueService,
  idsAreEqual,
  ListQueryOptions,
  LocaleStringHydrator,
  RelationPaths,
  Relations,
  RequestContext,
  Translated,
} from '@vendure/core';
import { KitService } from '../services/kit.service';
import { Kit } from '../entity/kit.entity';
import { KitVariant } from '../entity/kit-variant.entity';
import { KitVariantListOptions } from '../gql/generated';

@Resolver('Kit')
export class KitEntityResolver {
  constructor(
    private kitVariantService: KitVariantService,
    private assetService: AssetService,
    private kitService: KitService,
    private facetValueService: FacetValueService,
    private localeStringHydrator: LocaleStringHydrator,
  ) {}

  @ResolveField()
  name(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<string> {
    return this.localeStringHydrator.hydrateLocaleStringField(ctx, kit, 'name');
  }

  @ResolveField()
  slug(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<string> {
    return this.localeStringHydrator.hydrateLocaleStringField(ctx, kit, 'slug');
  }

  @ResolveField()
  description(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<string> {
    return this.localeStringHydrator.hydrateLocaleStringField(ctx, kit, 'description');
  }

  @ResolveField()
  languageCode(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<string> {
    return this.localeStringHydrator.hydrateLocaleStringField(ctx, kit, 'languageCode');
  }

  @ResolveField()
  async variants(
    @Ctx() ctx: RequestContext,
    @Parent() kit: Kit,
    @Relations({ entity: KitVariant }) relations: RelationPaths<KitVariant>,
  ): Promise<Array<KitVariant>> {
    const { items: variants } = await this.kitVariantService.getVariantsByKitId(ctx, kit.id, {}, relations);
    return variants;
  }

  @ResolveField()
  async variantList(
    @Ctx() ctx: RequestContext,
    @Parent() kit: Kit,
    @Args() args: { options: KitVariantListOptions },
    @Relations({ entity: KitVariant }) relations: RelationPaths<KitVariant>,
  ): Promise<PaginatedList<KitVariant>> {
    return this.kitVariantService.getVariantsByKitId(
      ctx,
      kit.id,
      (args.options || undefined) as ListQueryOptions<KitVariant>,
      relations,
    );
  }

  @ResolveField()
  async collections(
    @Ctx() ctx: RequestContext,
    @Parent() kit: Kit,
    @Api() apiType: ApiType,
  ): Promise<Array<Collection>> {
    return this.kitService.getCollectionsForKit(ctx, kit.id, apiType === 'shop');
  }

  @ResolveField()
  async facetValues(
    @Ctx() ctx: RequestContext,
    @Parent() kit: Kit,
    @Api() apiType: ApiType,
  ): Promise<Array<Translated<FacetValue>>> {
    if (kit.facetValues?.length === 0) {
      return [];
    }
    let facetValues: Array<Translated<FacetValue>>;
    if (kit.facetValues?.[0]?.channels) {
      facetValues = kit.facetValues as Array<Translated<FacetValue>>;
    } else {
      facetValues = await this.kitService.getFacetValuesForKit(ctx, kit.id);
    }
    const filteredFacetValues = await this.facetValueService.findByIds(
      ctx,
      facetValues.map(facetValue => facetValue.id),
    );

    if (apiType === 'shop') {
      return filteredFacetValues.filter(fv => !fv.facet.isPrivate);
    } else {
      return filteredFacetValues;
    }
  }

  @ResolveField()
  async featuredAsset(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<Asset | undefined> {
    if (kit.featuredAsset !== undefined) {
      return kit.featuredAsset;
    }
    return this.assetService.getFeaturedAsset(ctx, kit);
  }

  @ResolveField()
  async assets(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<Asset[] | undefined> {
    return this.assetService.getEntityAssets(ctx, kit);
  }
}

@Resolver('Kit')
export class KitAdminEntityResolver {
  constructor(private kitService: KitService) {}

  @ResolveField()
  async channels(@Ctx() ctx: RequestContext, @Parent() kit: Kit): Promise<Channel[]> {
    const isDefaultChannel = ctx.channel.code === DEFAULT_CHANNEL_CODE;
    const channels = kit.channels || (await this.kitService.getKitChannels(ctx, kit.id));
    return channels.filter(channel => (isDefaultChannel ? true : idsAreEqual(channel.id, ctx.channelId)));
  }
}

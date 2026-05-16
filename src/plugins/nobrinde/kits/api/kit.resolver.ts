import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '@vendure/common/lib/generated-types';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import { KitService } from '../services/kit.service';
import { KitVariantService } from '../services/kit-variant.service';
import {
  Allow,
  Ctx,
  ListQueryOptions,
  RelationPaths,
  Relations,
  RequestContext,
  Transaction,
  Translated,
  UserInputError,
} from '@vendure/core';
import { Kit } from '../entity/kit.entity';
import { KitVariant } from '../entity/kit-variant.entity';
import {
  MutationAssignKitsToChannelArgs,
  MutationCreateKitArgs,
  MutationCreateKitVariantArgs,
  MutationCreateKitVariantsArgs,
  MutationDeleteKitArgs,
  MutationDeleteKitsArgs,
  MutationDeleteKitVariantArgs,
  MutationDeleteKitVariantsArgs,
  MutationRemoveKitsFromChannelArgs,
  MutationUpdateKitArgs,
  MutationUpdateKitsArgs,
  MutationUpdateKitVariantArgs,
  MutationUpdateKitVariantsArgs,
  QueryKitArgs,
  QueryKitsArgs,
  QueryKitVariantArgs,
  QueryKitVariantsArgs,
} from '../gql/generated';
import { KitPermissions } from '../constants';

@Resolver()
export class KitResolver {
  constructor(
    private kitService: KitService,
    private kitVariantService: KitVariantService,
  ) {}

  @Query()
  @Allow(KitPermissions.Read)
  async kits(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryKitsArgs,
    @Relations({ entity: Kit, omit: ['variants', 'assets'] }) relations: RelationPaths<Kit>,
  ): Promise<PaginatedList<Translated<Kit>>> {
    return this.kitService.findAll(ctx, (args.options || undefined) as ListQueryOptions<Kit>, relations);
  }

  @Query()
  @Allow(KitPermissions.Read)
  async kit(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryKitArgs,
    @Relations({ entity: Kit, omit: ['variants', 'assets'] }) relations: RelationPaths<Kit>,
  ): Promise<Translated<Kit> | undefined> {
    if (args.id) {
      const kit = await this.kitService.findOne(ctx, args.id, relations);
      if (args.slug && kit && kit.slug !== args.slug) {
        throw new UserInputError('error.kit-id-slug-mismatch');
      }
      return kit;
    } else if (args.slug) {
      return this.kitService.findOneBySlug(ctx, args.slug, relations);
    } else {
      throw new UserInputError('error.kit-id-or-slug-must-be-provided');
    }
  }

  @Query()
  @Allow(KitPermissions.Read)
  async kitVariants(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryKitVariantsArgs,
    @Relations({ entity: KitVariant }) relations: RelationPaths<KitVariant>,
  ): Promise<PaginatedList<KitVariant>> {
    if (args.kitId) {
      return this.kitVariantService.getVariantsByKitId(
        ctx,
        args.kitId,
        (args.options || undefined) as ListQueryOptions<KitVariant>,
        relations,
      );
    }

    return this.kitVariantService.findAll(ctx, (args.options || undefined) as ListQueryOptions<KitVariant>);
  }

  @Query()
  @Allow(KitPermissions.Read)
  async kitVariant(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryKitVariantArgs,
  ): Promise<KitVariant | null> {
    return this.kitVariantService.findOne(ctx, args.id);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Create)
  async createKit(@Ctx() ctx: RequestContext, @Args() args: MutationCreateKitArgs): Promise<Kit> {
    const { input } = args;
    return this.kitService.create(ctx, input);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async updateKit(@Ctx() ctx: RequestContext, @Args() args: MutationUpdateKitArgs): Promise<Translated<Kit>> {
    const { input } = args;
    return await this.kitService.update(ctx, input);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async updateKits(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationUpdateKitsArgs,
  ): Promise<Array<Translated<Kit>>> {
    return await Promise.all(args.input.map(i => this.kitService.update(ctx, i)));
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Delete)
  async deleteKit(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationDeleteKitArgs,
  ): Promise<DeletionResponse> {
    return this.kitService.softDelete(ctx, args.id);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Delete)
  async deleteKits(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationDeleteKitsArgs,
  ): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.kitService.softDelete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async createKitVariants(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationCreateKitVariantsArgs,
  ): Promise<Array<KitVariant>> {
    const { input } = args;
    return this.kitVariantService.create(ctx, input);
  }
  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async createKitVariant(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationCreateKitVariantArgs,
  ): Promise<KitVariant> {
    const { input } = args;
    return this.kitVariantService.create(ctx, [input]).then(variants => variants[0]);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async updateKitVariant(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationUpdateKitVariantArgs,
  ): Promise<KitVariant> {
    const { input } = args;
    return this.kitVariantService.update(ctx, [input]).then(variants => variants[0]);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async updateKitVariants(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationUpdateKitVariantsArgs,
  ): Promise<Array<KitVariant>> {
    const { input } = args;
    return this.kitVariantService.update(ctx, input);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Delete)
  async deleteKitVariant(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationDeleteKitVariantArgs,
  ): Promise<DeletionResponse> {
    return this.kitVariantService.softDelete(ctx, args.id);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Delete)
  async deleteKitVariants(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationDeleteKitVariantsArgs,
  ): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.kitVariantService.softDelete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async assignKitsToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationAssignKitsToChannelArgs,
  ): Promise<Array<Translated<Kit>>> {
    return this.kitService.assignKitsToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(KitPermissions.Update)
  async removeKitsFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationRemoveKitsFromChannelArgs,
  ): Promise<Array<Translated<Kit>>> {
    return this.kitService.removeKitsFromChannel(ctx, args.input);
  }
}

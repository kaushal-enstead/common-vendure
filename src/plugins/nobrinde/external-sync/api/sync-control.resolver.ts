import { Mutation, Query, Resolver, Args } from '@nestjs/graphql';
import { Allow, Ctx, ListQueryOptions, RelationPaths, Relations, RequestContext } from '@vendure/core';
import { Permission } from '@vendure/common/lib/generated-types';
import { SyncTable } from '../entities/sync-table';
import { SyncControlService } from '../services/sync-control.service';
import { SyncRunnerService } from '../services/sync-runner.service';
import { NobrindeChannel } from '../../nobrinde-entity/entities/nobrinde-channels';

@Resolver()
export class SyncControlResolver {
  constructor(
    private syncControlService: SyncControlService,
    private syncRunner: SyncRunnerService,
  ) {}

  @Query()
  @Allow(Permission.ReadSettings)
  async syncTables(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<SyncTable> },
    @Relations({ entity: SyncTable }) relations: RelationPaths<SyncTable>,
  ) {
    return this.syncControlService.findAll(ctx, args.options, relations);
  }

  @Query()
  @Allow(Permission.ReadSettings)
  async syncTable(@Ctx() ctx: RequestContext, @Args('id') id: string) {
    return this.syncControlService.findOne(ctx, id);
  }

  @Query()
  @Allow(Permission.ReadSettings)
  async availableNobrindeChannels(
    @Ctx() ctx: RequestContext,
    @Args() args: { currentChannelId?: string; options?: ListQueryOptions<NobrindeChannel> },
    @Relations({ entity: NobrindeChannel }) relations: RelationPaths<NobrindeChannel>,
  ) {
    return this.syncControlService.getAvailableNobrindeChannels(
      ctx,
      args.currentChannelId,
      args.options,
      relations,
    );
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async updateSyncTable(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: { id: string; lastSyncedAt?: Date | string | null } },
  ) {
    let lastSyncedAt: Date | null;
    if (args.input.lastSyncedAt == null) {
      lastSyncedAt = null;
    } else if (args.input.lastSyncedAt instanceof Date) {
      lastSyncedAt = args.input.lastSyncedAt;
    } else {
      lastSyncedAt = new Date(args.input.lastSyncedAt);
    }
    return this.syncControlService.updateLastSyncedAt(ctx, args.input.id, lastSyncedAt);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runProductSync(@Ctx() ctx: RequestContext, @Args() args: { productIds: string[] }): Promise<boolean> {
    const productIds = args.productIds.map(id => parseInt(id, 10)).filter(n => !Number.isNaN(n));
    if (productIds.length === 0) return false;
    return this.syncRunner.runProductSync(ctx, productIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runVariantSync(@Ctx() ctx: RequestContext, @Args() args: { variantIds: string[] }): Promise<boolean> {
    const variantIds = args.variantIds.filter(Boolean);
    if (variantIds.length === 0) return false;
    return this.syncRunner.runVariantSync(ctx, variantIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runCollectionSync(
    @Ctx() ctx: RequestContext,
    @Args() args: { collectionIds: string[] },
  ): Promise<boolean> {
    const collectionIds = args.collectionIds.map(id => parseInt(id, 10)).filter(n => !Number.isNaN(n));
    if (collectionIds.length === 0) return false;
    return this.syncRunner.runCollectionSync(ctx, collectionIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runFacetSync(@Ctx() ctx: RequestContext, @Args() args: { facetIds: string[] }): Promise<boolean> {
    const facetIds = args.facetIds.map(id => parseInt(id, 10)).filter(n => !Number.isNaN(n));
    if (facetIds.length === 0) return false;
    return this.syncRunner.runFacetSync(ctx, facetIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runCustomerSync(
    @Ctx() ctx: RequestContext,
    @Args() args: { customerIds: string[] },
  ): Promise<boolean> {
    const customerIds = args.customerIds.filter(Boolean);
    if (customerIds.length === 0) return false;
    return this.syncRunner.runCustomerSync(ctx, customerIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runNobrindeBudgetSync(
    @Ctx() ctx: RequestContext,
    @Args() args: { budgetIds: string[] },
  ): Promise<boolean> {
    const budgetIds = args.budgetIds.filter(Boolean);
    if (budgetIds.length === 0) return false;
    return this.syncRunner.runNobrindeBudgetSync(ctx, budgetIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runNobrindeOrderSync(
    @Ctx() ctx: RequestContext,
    @Args() args: { orderIds: string[] },
  ): Promise<boolean> {
    const orderIds = args.orderIds.filter(Boolean);
    if (orderIds.length === 0) return false;
    return this.syncRunner.runNobrindeOrderSync(ctx, orderIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runNobrindeSaleUserSync(
    @Ctx() ctx: RequestContext,
    @Args() args: { saleUserIds: string[] },
  ): Promise<boolean> {
    const saleUserIds = args.saleUserIds.filter(Boolean);
    if (saleUserIds.length === 0) return false;
    return this.syncRunner.runNobrindeSaleUserSync(ctx, saleUserIds);
  }

  @Mutation()
  @Allow(Permission.UpdateSettings)
  async runNobrindeChannelSync(
    @Ctx() ctx: RequestContext,
    @Args() args: { channelIds: string[] },
  ): Promise<boolean> {
    const channelIds = args.channelIds.filter(Boolean);
    if (channelIds.length === 0) return false;
    return this.syncRunner.runNobrindeChannelSync(ctx, channelIds);
  }
}

import { Args, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, ListQueryOptions, RelationPaths, Relations, RequestContext } from '@vendure/core';
import { NobrindeChannel } from '../../entities/nobrinde-channels';
import { NobrindeChannelPermissions } from '../../constants';
import { NobrindeChannelService } from '../../services/nobrinde-channel.service';
import { PaginatedList } from '@vendure/core';

@Resolver()
export class NobrindeChannelResolver {
  constructor(private nobrindeChannelService: NobrindeChannelService) {}

  @Query()
  @Allow(NobrindeChannelPermissions.Read)
  async nobrindeChannels(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<NobrindeChannel> },
    @Relations({ entity: NobrindeChannel }) relations: RelationPaths<NobrindeChannel>,
  ): Promise<PaginatedList<NobrindeChannel>> {
    return this.nobrindeChannelService.findAll(ctx, args.options as never, relations);
  }

  @Query()
  @Allow(NobrindeChannelPermissions.Read)
  async nobrindeChannel(@Ctx() ctx: RequestContext, @Args('id') id: string): Promise<NobrindeChannel | null> {
    return this.nobrindeChannelService.findOne(ctx, id);
  }
}

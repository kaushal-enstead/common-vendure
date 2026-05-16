import { Args, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext } from '@vendure/core';
import { Permission } from '@vendure/common/lib/generated-types';
import { ChannelPersonalizationService } from '../services/channel-personalization.service';

@Resolver()
export class ChannelPersonalizationResolver {
  constructor(private channelPersonalizationService: ChannelPersonalizationService) {}

  @Query()
  @Allow(Permission.Public)
  async channelByDomain(@Ctx() ctx: RequestContext, @Args('domain') domain: string) {
    return this.channelPersonalizationService.getChannelByDomain(ctx, domain);
  }
}

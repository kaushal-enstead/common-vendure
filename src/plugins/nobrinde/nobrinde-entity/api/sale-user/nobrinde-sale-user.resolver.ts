import { Args, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, ListQueryOptions, RelationPaths, Relations, RequestContext } from '@vendure/core';
import { NobrindeSaleUser } from '../../entities/nobrinde-sale-users';
import { NobrindeSaleUserPermissions } from '../../constants';
import { NobrindeSaleUserService } from '../../services/nobrinde-sale-user.service';
import { PaginatedList } from '@vendure/core';
import { QueryNobrindeSaleUsersArgs } from '../../gql/generated';

@Resolver()
export class NobrindeSaleUserResolver {
  constructor(private nobrindeSaleUserService: NobrindeSaleUserService) {}

  @Query()
  @Allow(NobrindeSaleUserPermissions.Read)
  async nobrindeSaleUsers(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryNobrindeSaleUsersArgs,
    @Relations({ entity: NobrindeSaleUser }) relations: RelationPaths<NobrindeSaleUser>,
  ): Promise<PaginatedList<NobrindeSaleUser>> {
    return this.nobrindeSaleUserService.findAll(ctx, args.options as never, relations);
  }

  @Query()
  @Allow(NobrindeSaleUserPermissions.Read)
  async nobrindeSaleUser(
    @Ctx() ctx: RequestContext,
    @Args('id') id: string,
  ): Promise<NobrindeSaleUser | null> {
    return this.nobrindeSaleUserService.findOne(ctx, id);
  }
}

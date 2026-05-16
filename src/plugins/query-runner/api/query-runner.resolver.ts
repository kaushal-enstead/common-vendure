import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext } from '@vendure/core';
import { QueryRunnerService } from '../services/query-runner.service';
import { QueryRunnerPermissions } from '../constants';
import { MutationExecuteQueryArgs, QueryResult } from '../gql/generated';

@Resolver()
export class QueryRunnerResolver {
  constructor(private queryRunnerService: QueryRunnerService) {}

  @Mutation()
  @Allow(QueryRunnerPermissions.Permission)
  async executeQuery(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationExecuteQueryArgs,
  ): Promise<QueryResult> {
    return this.queryRunnerService.executeQuery(ctx, args.query);
  }
}

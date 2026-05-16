import { Args, Query, Resolver } from '@nestjs/graphql';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import { Allow, Ctx, ListQueryOptions, RelationPaths, Relations, RequestContext } from '@vendure/core';

import { SupportSubject } from '../entities/support-subject.entity';
import { SupportSubjectService } from '../services/support-subject.service';
import { Permission } from '../gql/generated';

@Resolver()
export class SupportSubjectShopResolver {
  constructor(private supportSubjectService: SupportSubjectService) {}

  @Query()
  @Allow(Permission.Public)
  async supportSubjects(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<SupportSubject> },
    @Relations(SupportSubject)
    relations: RelationPaths<SupportSubject>,
  ): Promise<PaginatedList<SupportSubject>> {
    return this.supportSubjectService.findAll(ctx, args.options, relations);
  }
}

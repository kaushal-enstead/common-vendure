import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateSupportSubjectInput, UpdateSupportSubjectInput } from '../gql/generated';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import {
  Allow,
  Ctx,
  ListQueryOptions,
  RelationPaths,
  Relations,
  RequestContext,
  Transaction,
} from '@vendure/core';

import { SupportSubject } from '../entities/support-subject.entity';
import { SupportSubjectService } from '../services/support-subject.service';
import { DeletionResponse } from '@vendure/common/lib/generated-types';
import { SupportSubjectPermissions } from '../constants';

@Resolver()
export class SupportSubjectResolver {
  constructor(private supportSubjectService: SupportSubjectService) {}

  @Query()
  @Allow(SupportSubjectPermissions.Read)
  async supportSubjects(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<SupportSubject> },
    @Relations(SupportSubject)
    relations: RelationPaths<SupportSubject>,
  ): Promise<PaginatedList<SupportSubject>> {
    return this.supportSubjectService.findAll(ctx, args.options, relations);
  }

  @Query()
  @Allow(SupportSubjectPermissions.Read)
  async supportSubject(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: string },
  ): Promise<SupportSubject | null> {
    return this.supportSubjectService.findOne(ctx, args.id);
  }

  @Mutation()
  @Allow(SupportSubjectPermissions.Create)
  @Transaction()
  async createSupportSubject(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateSupportSubjectInput },
  ): Promise<SupportSubject> {
    return this.supportSubjectService.create(ctx, args.input);
  }

  @Mutation()
  @Allow(SupportSubjectPermissions.Update)
  @Transaction()
  async updateSupportSubject(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateSupportSubjectInput },
  ): Promise<SupportSubject> {
    return this.supportSubjectService.update(ctx, args.input);
  }

  @Mutation()
  @Allow(SupportSubjectPermissions.Delete)
  @Transaction()
  async deleteSupportSubject(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: string },
  ): Promise<DeletionResponse> {
    return await this.supportSubjectService.delete(ctx, args.id);
  }

  @Mutation()
  @Allow(SupportSubjectPermissions.Delete)
  @Transaction()
  async deleteSupportSubjects(
    @Ctx() ctx: RequestContext,
    @Args() args: { ids: string[] },
  ): Promise<DeletionResponse[]> {
    const result = await Promise.all(args.ids.map(id => this.supportSubjectService.delete(ctx, id)));
    return result;
  }
}

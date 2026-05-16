import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, Allow, Permission } from '@vendure/core';
import { FileCacheService } from '../services/file-cache.service';
import {
  CreateFileCacheInput,
  FileCacheListOptions,
  MutationDeleteFileCacheArgs,
  UpdateFileCacheInput,
} from '../gql/generated';
@Resolver()
export class FileCacheAdminResolver {
  constructor(private fileCacheService: FileCacheService) {}

  @Query()
  // @Allow(Permission.SuperAdmin)
  async fileCacheEntries(@Ctx() ctx: RequestContext, @Args() args: { options: FileCacheListOptions }) {
    return this.fileCacheService.findAll(ctx, args.options);
  }

  @Query()
  // @Allow(Permission.SuperAdmin)
  async fileCacheEntry(@Ctx() ctx: RequestContext, @Args() args: { id: string }) {
    return this.fileCacheService.find(ctx, args.id);
  }

  @Mutation()
  // @Allow(Permission.SuperAdmin)
  async createFileCache(@Ctx() ctx: RequestContext, @Args() args: { input: CreateFileCacheInput }) {
    return this.fileCacheService.create(ctx, args.input);
  }

  @Mutation()
  // @Allow(Permission.SuperAdmin)
  async updateFileCache(@Ctx() ctx: RequestContext, @Args() args: { input: UpdateFileCacheInput }) {
    return this.fileCacheService.update(ctx, args.input);
  }

  @Mutation()
  // @Allow(Permission.SuperAdmin)
  async deleteFileCache(@Ctx() ctx: RequestContext, @Args() args: MutationDeleteFileCacheArgs) {
    return Promise.all(args.ids.map(id => this.fileCacheService.delete(ctx, id)));
  }
}

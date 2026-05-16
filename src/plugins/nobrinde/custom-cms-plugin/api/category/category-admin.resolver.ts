import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '@vendure/common/lib/generated-types';
import {
  Allow,
  Ctx,
  ID,
  ListQueryOptions,
  PaginatedList,
  RelationPaths,
  Relations,
  RequestContext,
  Transaction,
} from '@vendure/core';
import { Category } from '../../entities/category/category.entity';
import { CategoryService } from '../../services/category.service';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  AssignCategoriesToChannelInput,
  RemoveCategoriesFromChannelInput,
  Permission,
} from '../../gql/generated';

@Resolver()
export class CategoryAdminResolver {
  constructor(private categoryService: CategoryService) {}

  @Query()
  @Allow(Permission.ReadCategory)
  async category(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Category) relations: RelationPaths<Category>,
  ): Promise<Category | null> {
    return this.categoryService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadCategory)
  async categories(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Category> },
    @Relations(Category) relations: RelationPaths<Category>,
  ): Promise<PaginatedList<Category>> {
    return this.categoryService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreateCategory)
  async createCategory(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateCategoryInput },
  ): Promise<Category> {
    return this.categoryService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdateCategory)
  async updateCategory(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateCategoryInput },
  ): Promise<Category> {
    return this.categoryService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteCategory)
  async deleteCategory(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.categoryService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteCategory)
  async deleteCategories(
    @Ctx() ctx: RequestContext,
    @Args() args: { ids: ID[] },
  ): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.categoryService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateCategory)
  async assignCategoriesToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignCategoriesToChannelInput },
  ): Promise<Category[]> {
    return this.categoryService.assignCategoriesToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateCategory)
  async removeCategoriesFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveCategoriesFromChannelInput },
  ): Promise<Category[]> {
    return this.categoryService.removeCategoriesFromChannel(ctx, args.input);
  }
}

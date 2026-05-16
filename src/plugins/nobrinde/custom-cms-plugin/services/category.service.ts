import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
  assertFound,
  ChannelService,
} from '@vendure/core';
import { In } from 'typeorm';
import { CMS_PLUGIN_OPTIONS } from '../constants';
import { Category } from '../entities/category/category.entity';
import { PluginInitOptions } from '../types';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  AssignCategoriesToChannelInput,
  RemoveCategoriesFromChannelInput,
} from '../gql/generated';

@Injectable()
export class CategoryService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private channelService: ChannelService,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  findByIds(
    ctx: RequestContext,
    categoryIds: ID[],
    relations?: RelationPaths<Category>,
  ): Promise<Category[]> {
    return this.connection.getRepository(ctx, Category).find({
      where: { id: In(categoryIds) },
      relations,
    });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Category>,
    relations?: RelationPaths<Category>,
  ): Promise<PaginatedList<Category>> {
    return this.listQueryBuilder
      .build(Category, options, {
        relations,
        ctx,
        channelId: ctx.channelId,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Category>): Promise<Category | null> {
    return this.connection.getRepository(ctx, Category).findOne({
      where: { id },
      relations,
    });
  }

  async create(ctx: RequestContext, input: CreateCategoryInput): Promise<Category> {
    const newEntity = this.connection.getRepository(ctx, Category).create(input);
    const saved = await this.connection.getRepository(ctx, Category).save(newEntity);
    await this.channelService.assignToChannels(ctx, Category, saved.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, saved.id));
  }

  async update(ctx: RequestContext, input: UpdateCategoryInput): Promise<Category> {
    const entity = await this.connection.getEntityOrThrow(ctx, Category, input.id);
    Object.assign(entity, input);
    await this.connection.getRepository(ctx, Category).save(entity);
    return assertFound(this.findOne(ctx, entity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Category, id);
    try {
      await this.connection.getRepository(ctx, Category).remove(entity);
      return {
        result: DeletionResult.DELETED,
      };
    } catch (e: any) {
      return {
        result: DeletionResult.NOT_DELETED,
        message: e.toString(),
      };
    }
  }

  async assignCategoriesToChannel(
    ctx: RequestContext,
    input: AssignCategoriesToChannelInput,
  ): Promise<Category[]> {
    const categories = await this.connection.getRepository(ctx, Category).find({
      where: { id: In(input.categoryIds) },
    });
    for (const category of categories) {
      this.channelService.assignToChannels(ctx, Category, category.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      categories.map(p => p.id),
    );
  }

  async removeCategoriesFromChannel(
    ctx: RequestContext,
    input: RemoveCategoriesFromChannelInput,
  ): Promise<Category[]> {
    const categories = await this.connection.getRepository(ctx, Category).find({
      where: { id: In(input.categoryIds) },
    });
    for (const category of categories) {
      this.channelService.removeFromChannels(ctx, Category, category.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      categories.map(p => p.id),
    );
  }
}

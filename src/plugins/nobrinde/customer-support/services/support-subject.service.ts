import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  assertFound,
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
  TranslatableSaver,
  Translated,
  TranslatorService,
} from '@vendure/core';
import { CUSTOMER_SUPPORT_PLUGIN_OPTIONS } from '../constants';
import { SupportSubjectTranslation } from '../entities/support-subject-translation.entity';
import { SupportSubject } from '../entities/support-subject.entity';
import { CreateSupportSubjectInput, UpdateSupportSubjectInput } from '../gql/generated';
import { PluginInitOptions } from '../types';

@Injectable()
export class SupportSubjectService {
  constructor(
    private connection: TransactionalConnection,
    private translatableSaver: TranslatableSaver,
    private listQueryBuilder: ListQueryBuilder,
    private translator: TranslatorService,
    @Inject(CUSTOMER_SUPPORT_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<SupportSubject>,
    relations?: RelationPaths<SupportSubject>,
  ): Promise<PaginatedList<Translated<SupportSubject>>> {
    return this.listQueryBuilder
      .build(SupportSubject, options, {
        relations,
        ctx,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items: items.map(item => this.translator.translate(item, ctx)),
          totalItems,
        };
      });
  }

  findOne(
    ctx: RequestContext,
    id: ID,
    relations?: RelationPaths<SupportSubject>,
  ): Promise<Translated<SupportSubject> | null> {
    return this.connection
      .getRepository(ctx, SupportSubject)
      .findOne({
        where: { id },
        relations,
      })
      .then(entity => entity && this.translator.translate(entity, ctx));
  }

  async create(ctx: RequestContext, input: CreateSupportSubjectInput): Promise<Translated<SupportSubject>> {
    const newEntity = await this.translatableSaver.create({
      ctx,
      input,
      entityType: SupportSubject,
      translationType: SupportSubjectTranslation,
      beforeSave: async f => {
        // Any pre-save logic can go here
      },
    });
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateSupportSubjectInput): Promise<Translated<SupportSubject>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: SupportSubject,
      translationType: SupportSubjectTranslation,
      beforeSave: async f => {
        // Any pre-save logic can go here
      },
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, SupportSubject, id);
    try {
      await this.connection.getRepository(ctx, SupportSubject).remove(entity);
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
}

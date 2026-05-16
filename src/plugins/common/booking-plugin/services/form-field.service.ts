import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    TranslatableSaver,
    Translated,
    TranslatorService,
    assertFound,
} from '@vendure/core';
import { BOOKING_PLUGIN_OPTIONS } from '../constants';
import { FormFieldTranslation } from '../entities/form-field-translation.entity';
import { FormField } from '../entities/form-fields.entity';
import { CreateFormFieldInput, UpdateFormFieldInput } from '../gql/generated';
import { PluginInitOptions } from '../types';

@Injectable()
export class FormFieldService {
    constructor(
        private connection: TransactionalConnection,
        private translatableSaver: TranslatableSaver,
        private listQueryBuilder: ListQueryBuilder,
        private translator: TranslatorService,
        @Inject(BOOKING_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<FormField>,
        relations?: RelationPaths<FormField>,
    ): Promise<PaginatedList<Translated<FormField>>> {
        return this.listQueryBuilder
            .build(FormField, options, {
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
        relations?: RelationPaths<FormField>,
    ): Promise<Translated<FormField> | null> {
        return this.connection
            .getRepository(ctx, FormField)
            .findOne({
                where: { id },
                relations,
            })
            .then(entity => entity && this.translator.translate(entity, ctx));
    }

    async create(ctx: RequestContext, input: CreateFormFieldInput): Promise<Translated<FormField>> {
        const newEntity = await this.translatableSaver.create({
            ctx,
            input,
            entityType: FormField,
            translationType: FormFieldTranslation,
            beforeSave: async f => {},
        });
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateFormFieldInput): Promise<Translated<FormField>> {
        const updatedEntity = await this.translatableSaver.update({
            ctx,
            input,
            entityType: FormField,
            translationType: FormFieldTranslation,
            beforeSave: async f => {},
        });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, FormField, id);
        try {
            await this.connection.getRepository(ctx, FormField).remove(entity);
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

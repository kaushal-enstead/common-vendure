import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
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
import { In, IsNull } from 'typeorm';
import { BOOKING_PLUGIN_OPTIONS } from '../constants';
import { FormTranslation } from '../entities/form-field-translation.entity';
import { Form, FormField } from '../entities/form-fields.entity';
import { CreateFormInput, UpdateFormInput } from '../gql/generated';
import { PluginInitOptions } from '../types';

@Injectable()
export class FormService {
    private readonly relations: RelationPaths<Form> = ['fields.forms'];
    constructor(
        private connection: TransactionalConnection,
        private translatableSaver: TranslatableSaver,
        private listQueryBuilder: ListQueryBuilder,
        private translator: TranslatorService,
        @Inject(BOOKING_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    private translateEntity(item: Form, ctx: RequestContext) {
        return this.translator.translate(item, ctx, ['fields']);
    }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<Form>,
        relations?: RelationPaths<Form>,
    ): Promise<PaginatedList<Translated<Form>>> {
        const effectiveRelations = relations ?? this.relations.slice();
        return this.listQueryBuilder
            .build(Form, options, {
                relations: unique(effectiveRelations),
                ctx,
                where: { deletedAt: IsNull() },
            })
            .getManyAndCount()
            .then(([items, totalItems]) => {
                return {
                    items: items.map(item => this.translateEntity(item, ctx)),
                    totalItems,
                };
            });
    }

    findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Form>): Promise<Translated<Form> | null> {
        const effectiveRelations = relations ?? this.relations.slice();
        return this.connection
            .getRepository(ctx, Form)
            .findOne({
                where: { id, deletedAt: IsNull() },
                relations: unique(effectiveRelations),
            })
            .then(entity => entity && this.translateEntity(entity, ctx));
    }

    async create(ctx: RequestContext, input: CreateFormInput): Promise<Translated<Form>> {
        const newEntity = await this.translatableSaver.create({
            ctx,
            input,
            entityType: Form,
            translationType: FormTranslation,
            beforeSave: async f => {
                f.fields = await this.connection
                    .getRepository(ctx, FormField)
                    .findBy({ id: In(input.fieldIds || []) });
            },
        });
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateFormInput): Promise<Translated<Form>> {
        const updatedEntity = await this.translatableSaver.update({
            ctx,
            input,
            entityType: Form,
            translationType: FormTranslation,
            beforeSave: async f => {
                if (input.fieldIds) {
                    f.fields = await this.connection
                        .getRepository(ctx, FormField)
                        .findBy({ id: In(input.fieldIds || []) });
                }
            },
        });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, Form, id);
        try {
            await this.connection.getRepository(ctx, Form).remove(entity);
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

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse, Permission } from '@vendure/common/lib/generated-types';
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
import { FormField } from '../entities/form-fields.entity';
import { CreateFormFieldInput, UpdateFormFieldInput } from '../gql/generated';
import { FormFieldService } from '../services/form-field.service';

@Resolver()
export class FormFieldAdminResolver {
    constructor(private formFieldService: FormFieldService) {}

    @Query()
    @Allow(Permission.Authenticated)
    async formField(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(FormField) relations: RelationPaths<FormField>,
    ): Promise<FormField | null> {
        return this.formFieldService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Authenticated)
    async formFields(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<FormField> },
        @Relations(FormField) relations: RelationPaths<FormField>,
    ): Promise<PaginatedList<FormField>> {
        return this.formFieldService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async createFormField(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateFormFieldInput },
    ): Promise<FormField> {
        return this.formFieldService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async updateFormField(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateFormFieldInput },
    ): Promise<FormField> {
        return this.formFieldService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async deleteFormField(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
        return this.formFieldService.delete(ctx, args.id);
    }
}

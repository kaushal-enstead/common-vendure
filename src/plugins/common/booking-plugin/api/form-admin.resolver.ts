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
import { Form } from '../entities/form-fields.entity';
import { CreateFormInput, MutationDeleteFormArgs, UpdateFormInput } from '../gql/generated';
import { FormService } from '../services/form.service';

@Resolver()
export class FormAdminResolver {
    constructor(private formService: FormService) {}

    @Query()
    @Allow(Permission.Authenticated)
    async form(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(Form) relations: RelationPaths<Form>,
    ): Promise<Form | null> {
        return this.formService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Authenticated)
    async forms(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Form> },
        @Relations(Form) relations: RelationPaths<Form>,
    ): Promise<PaginatedList<Form>> {
        return this.formService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async createForm(@Ctx() ctx: RequestContext, @Args() args: { input: CreateFormInput }): Promise<Form> {
        return this.formService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async updateForm(@Ctx() ctx: RequestContext, @Args() args: { input: UpdateFormInput }): Promise<Form> {
        return this.formService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async deleteForm(
        @Ctx() ctx: RequestContext,
        @Args() args: MutationDeleteFormArgs,
    ): Promise<DeletionResponse> {
        return this.formService.delete(ctx, args.id);
    }
}

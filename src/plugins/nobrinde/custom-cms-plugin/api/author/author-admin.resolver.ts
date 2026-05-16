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
  Translated,
} from '@vendure/core';
import { Author } from '../../entities/author/author.entity';
import { AuthorService } from '../../services/author.service';
import {
  CreateAuthorInput,
  UpdateAuthorInput,
  AssignAuthorsToChannelInput,
  RemoveAuthorsFromChannelInput,
  Permission,
} from '../../gql/generated';

@Resolver()
export class AuthorAdminResolver {
  constructor(private authorService: AuthorService) {}

  @Query()
  @Allow(Permission.ReadAuthor)
  async author(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Author) relations: RelationPaths<Author>,
  ): Promise<Translated<Author> | null> {
    return this.authorService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadAuthor)
  async authors(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Author> },
    @Relations(Author) relations: RelationPaths<Author>,
  ): Promise<PaginatedList<Translated<Author>>> {
    return this.authorService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreateAuthor)
  async createAuthor(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateAuthorInput },
  ): Promise<Translated<Author>> {
    return this.authorService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdateAuthor)
  async updateAuthor(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateAuthorInput },
  ): Promise<Translated<Author>> {
    return this.authorService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteAuthor)
  async deleteAuthor(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.authorService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteAuthor)
  async deleteAuthors(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.authorService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateAuthor)
  async assignAuthorsToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignAuthorsToChannelInput },
  ): Promise<Array<Translated<Author>>> {
    return this.authorService.assignAuthorsToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateAuthor)
  async removeAuthorsFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveAuthorsFromChannelInput },
  ): Promise<Array<Translated<Author>>> {
    return this.authorService.removeAuthorsFromChannel(ctx, args.input);
  }
}

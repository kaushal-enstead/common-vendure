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
import { Document } from '../../entities/document/document.entity';
import { DocumentService } from '../../services/document.service';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  AssignDocumentsToChannelInput,
  RemoveDocumentsFromChannelInput,
  Permission,
} from '../../gql/generated';
import { DocumentPermissions } from '../../constants';
@Resolver()
export class DocumentAdminResolver {
  constructor(private documentService: DocumentService) {}

  @Query()
  @Allow(DocumentPermissions.Read)
  async document(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Document) relations: RelationPaths<Document>,
  ): Promise<Translated<Document> | null> {
    return this.documentService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(DocumentPermissions.Read)
  async documents(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Document> },
    @Relations(Document) relations: RelationPaths<Document>,
  ): Promise<PaginatedList<Translated<Document>>> {
    return this.documentService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(DocumentPermissions.Create)
  async createDocument(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateDocumentInput },
  ): Promise<Translated<Document>> {
    return this.documentService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(DocumentPermissions.Update)
  async updateDocument(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateDocumentInput },
  ): Promise<Translated<Document>> {
    return this.documentService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(DocumentPermissions.Delete)
  async deleteDocument(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.documentService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(DocumentPermissions.Delete)
  async deleteDocuments(
    @Ctx() ctx: RequestContext,
    @Args() args: { ids: ID[] },
  ): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.documentService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(DocumentPermissions.Update)
  async assignDocumentsToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignDocumentsToChannelInput },
  ): Promise<Array<Translated<Document>>> {
    return this.documentService.assignDocumentsToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(DocumentPermissions.Update)
  async removeDocumentsFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveDocumentsFromChannelInput },
  ): Promise<Array<Translated<Document>>> {
    return this.documentService.removeDocumentsFromChannel(ctx, args.input);
  }
}

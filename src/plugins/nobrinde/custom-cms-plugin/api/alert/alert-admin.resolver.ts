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
import { Alert } from '../../entities/alert/alert.entity';
import { AlertService } from '../../services/alert.service';
import { PageBuilderService } from '../../services/page-builder.service';
import { AuthorService } from '../../services/author.service';
import { DocumentService } from '../../services/document.service';
import {
  CreateAlertInput,
  UpdateAlertInput,
  AssignAlertsToChannelInput,
  RemoveAlertsFromChannelInput,
  Permission,
  LinkRefOptions,
  LinkRefOption,
} from '../../gql/generated';

@Resolver()
export class AlertAdminResolver {
  constructor(
    private alertService: AlertService,
    private pageBuilderService: PageBuilderService,
    private authorService: AuthorService,
    private documentService: DocumentService,
  ) {}

  @Query()
  @Allow(Permission.ReadAlert)
  async alert(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Alert) relations: RelationPaths<Alert>,
  ): Promise<Translated<Alert> | null> {
    return this.alertService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(Permission.ReadAlert)
  async alerts(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<Alert> },
    @Relations(Alert) relations: RelationPaths<Alert>,
  ): Promise<PaginatedList<Translated<Alert>>> {
    return this.alertService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.CreateAlert)
  async createAlert(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateAlertInput },
  ): Promise<Translated<Alert>> {
    return this.alertService.create(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.UpdateAlert)
  async updateAlert(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateAlertInput },
  ): Promise<Translated<Alert>> {
    return this.alertService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteAlert)
  async deleteAlert(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
    return this.alertService.delete(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(Permission.DeleteAlert)
  async deleteAlerts(@Ctx() ctx: RequestContext, @Args() args: { ids: ID[] }): Promise<DeletionResponse[]> {
    return Promise.all(args.ids.map(id => this.alertService.delete(ctx, id)));
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateAlert)
  async assignAlertsToChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AssignAlertsToChannelInput },
  ): Promise<Array<Translated<Alert>>> {
    return this.alertService.assignAlertsToChannel(ctx, args.input);
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateAlert)
  async removeAlertsFromChannel(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: RemoveAlertsFromChannelInput },
  ): Promise<Array<Translated<Alert>>> {
    return this.alertService.removeAlertsFromChannel(ctx, args.input);
  }

  @Query()
  @Allow(Permission.ReadAlert)
  async linkRefOptions(@Ctx() ctx: RequestContext): Promise<LinkRefOptions> {
    // Fetch active pages
    const pagesResult = await this.pageBuilderService.findAll(ctx, {
      filter: { active: { eq: true } },
    });
    const pages: LinkRefOption[] = pagesResult.items.map(page => ({
      entity: 'page',
      label: page.title || `Page ${page.id}`,
      value: page.id.toString(),
    }));

    // Fetch active authors
    const authorsResult = await this.authorService.findAll(ctx, {
      filter: { active: { eq: true } },
    });
    const authors: LinkRefOption[] = authorsResult.items.map(author => ({
      entity: 'author',
      label: author.name || `Author ${author.id}`,
      value: author.id.toString(),
    }));

    // Fetch active documents
    const documentsResult = await this.documentService.findAll(ctx, {
      filter: { active: { eq: true } },
    });
    const documents: LinkRefOption[] = documentsResult.items.map(doc => {
      const title = doc.title || doc.code || `Document ${doc.id}`;
      return {
        entity: 'document',
        label:
          typeof title === 'string' ? title : title[ctx.languageCode] || doc.code || `Document ${doc.id}`,
        value: doc.id.toString(),
      };
    });

    return {
      page: pages,
      author: authors,
      document: documents,
    };
  }
}

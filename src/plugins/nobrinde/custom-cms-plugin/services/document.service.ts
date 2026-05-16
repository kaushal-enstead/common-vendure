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
  TranslatableSaver,
  Translated,
  TranslatorService,
  ChannelService,
} from '@vendure/core';
import { In } from 'typeorm';
import { CMS_PLUGIN_OPTIONS } from '../constants';
import { Document } from '../entities/document/document.entity';
import { DocumentTranslation } from '../entities/document/document-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  AssignDocumentsToChannelInput,
  RemoveDocumentsFromChannelInput,
} from '../gql/generated';

@Injectable()
export class DocumentService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private translatableSaver: TranslatableSaver,
    private translator: TranslatorService,
    private channelService: ChannelService,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  findByIds(
    ctx: RequestContext,
    documentIds: ID[],
    relations?: RelationPaths<Document>,
  ): Promise<Array<Translated<Document>>> {
    return this.connection
      .getRepository(ctx, Document)
      .find({ where: { id: In(documentIds) }, relations })
      .then(documents => {
        return documents.map(document => this.translator.translate(document, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Document>,
    relations?: RelationPaths<Document>,
  ): Promise<PaginatedList<Translated<Document>>> {
    return this.listQueryBuilder
      .build(Document, options, {
        relations,
        ctx,
        channelId: ctx.channelId,
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
    relations?: RelationPaths<Document>,
  ): Promise<Translated<Document> | null> {
    return this.connection
      .getRepository(ctx, Document)
      .findOne({
        where: { id },
        relations,
      })
      .then(entity => {
        if (entity) {
          return this.translator.translate(entity, ctx);
        }
        return null;
      });
  }

  async create(ctx: RequestContext, input: CreateDocumentInput): Promise<Translated<Document>> {
    // Get all available language codes for the current channel
    const channel = await this.channelService.getChannelFromToken(ctx, ctx.channel.token);
    const { availableLanguageCodes } = channel;

    // If input.translations is present and at least one translation, use the first as source
    const baseTranslation =
      input.translations && input.translations.length > 0 ? input.translations[0] : null;

    // Build translations for all available languages
    const translations =
      baseTranslation && Array.isArray(availableLanguageCodes) && availableLanguageCodes.length > 0
        ? availableLanguageCodes.map((lang: any) => ({
            ...baseTranslation,
            languageCode: lang,
            id: undefined, // avoid setting id, let ORM assign
          }))
        : input.translations;

    // Ensure we pass the patched translations to the input for creation
    const fullInput = {
      ...input,
      translations,
    };

    const newEntity = await this.translatableSaver.create({
      ctx,
      input: fullInput,
      entityType: Document,
      translationType: DocumentTranslation,
    });
    await this.channelService.assignToChannels(ctx, Document, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateDocumentInput): Promise<Translated<Document>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Document,
      translationType: DocumentTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Document, id);
    try {
      await this.connection.getRepository(ctx, Document).remove(entity);
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

  async assignDocumentsToChannel(
    ctx: RequestContext,
    input: AssignDocumentsToChannelInput,
  ): Promise<Array<Translated<Document>>> {
    const documents = await this.connection.getRepository(ctx, Document).find({
      where: { id: In(input.documentIds) },
    });
    for (const document of documents) {
      this.channelService.assignToChannels(ctx, Document, document.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      documents.map(p => p.id),
    );
  }

  async removeDocumentsFromChannel(
    ctx: RequestContext,
    input: RemoveDocumentsFromChannelInput,
  ): Promise<Array<Translated<Document>>> {
    const documents = await this.connection.getRepository(ctx, Document).find({
      where: { id: In(input.documentIds) },
    });
    for (const document of documents) {
      this.channelService.removeFromChannels(ctx, Document, document.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      documents.map(p => p.id),
    );
  }
}

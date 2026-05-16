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
import { Author } from '../entities/author/author.entity';
import { AuthorTranslation } from '../entities/author/author-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateAuthorInput,
  UpdateAuthorInput,
  AssignAuthorsToChannelInput,
  RemoveAuthorsFromChannelInput,
} from '../gql/generated';

@Injectable()
export class AuthorService {
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
    authorIds: ID[],
    relations?: RelationPaths<Author>,
  ): Promise<Array<Translated<Author>>> {
    return this.connection
      .getRepository(ctx, Author)
      .find({ where: { id: In(authorIds) }, relations })
      .then(authors => {
        return authors.map(author => this.translator.translate(author, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Author>,
    relations?: RelationPaths<Author>,
  ): Promise<PaginatedList<Translated<Author>>> {
    return this.listQueryBuilder
      .build(Author, options, {
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
    relations?: RelationPaths<Author>,
  ): Promise<Translated<Author> | null> {
    return this.connection
      .getRepository(ctx, Author)
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

  async create(ctx: RequestContext, input: CreateAuthorInput): Promise<Translated<Author>> {
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
      entityType: Author,
      translationType: AuthorTranslation,
    });
    await this.channelService.assignToChannels(ctx, Author, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateAuthorInput): Promise<Translated<Author>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Author,
      translationType: AuthorTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Author, id);
    try {
      await this.connection.getRepository(ctx, Author).remove(entity);
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

  async assignAuthorsToChannel(
    ctx: RequestContext,
    input: AssignAuthorsToChannelInput,
  ): Promise<Array<Translated<Author>>> {
    const authors = await this.connection.getRepository(ctx, Author).find({
      where: { id: In(input.authorIds) },
    });
    for (const author of authors) {
      this.channelService.assignToChannels(ctx, Author, author.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      authors.map(p => p.id),
    );
  }

  async removeAuthorsFromChannel(
    ctx: RequestContext,
    input: RemoveAuthorsFromChannelInput,
  ): Promise<Array<Translated<Author>>> {
    const authors = await this.connection.getRepository(ctx, Author).find({
      where: { id: In(input.authorIds) },
    });
    for (const author of authors) {
      this.channelService.removeFromChannels(ctx, Author, author.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      authors.map(p => p.id),
    );
  }
}

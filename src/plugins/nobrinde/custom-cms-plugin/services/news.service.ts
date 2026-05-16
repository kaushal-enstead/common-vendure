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
import { News } from '../entities/news/news.entity';
import { NewsTranslation } from '../entities/news/news-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateNewsInput,
  UpdateNewsInput,
  AssignNewsToChannelInput,
  RemoveNewsFromChannelInput,
} from '../gql/generated';

@Injectable()
export class NewsService {
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
    newsIds: ID[],
    relations?: RelationPaths<News>,
  ): Promise<Array<Translated<News>>> {
    return this.connection
      .getRepository(ctx, News)
      .find({ where: { id: In(newsIds) }, relations })
      .then(news => {
        return news.map(item => this.translator.translate(item, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<News>,
    relations?: RelationPaths<News>,
  ): Promise<PaginatedList<Translated<News>>> {
    return this.listQueryBuilder
      .build(News, options, {
        relations,
        ctx,
        channelId: ctx.channelId,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items: items.map(item => {
            const translatedItem = this.translator.translate(item, ctx);
            if (item.author) {
              translatedItem.author = this.translator.translate(item.author, ctx);
            }
            return translatedItem;
          }),
          totalItems,
        };
      });
  }

  findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<News>): Promise<Translated<News> | null> {
    return this.connection
      .getRepository(ctx, News)
      .findOne({
        where: { id },
        relations,
      })
      .then(entity => {
        if (entity) {
          const translatedEntity = this.translator.translate(entity, ctx);
          if (entity.author) {
            translatedEntity.author = this.translator.translate(entity.author, ctx);
          }
          return translatedEntity;
        }
        return null;
      });
  }

  async create(ctx: RequestContext, input: CreateNewsInput): Promise<Translated<News>> {
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
      entityType: News,
      translationType: NewsTranslation,
    });

    // Handle relatedNewsIds
    newEntity.relatedNewsIds = input.relatedNewsIds || [];
    await this.connection.getRepository(ctx, News).save(newEntity);

    await this.channelService.assignToChannels(ctx, News, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id, ['author', 'category']));
  }

  async update(ctx: RequestContext, input: UpdateNewsInput): Promise<Translated<News>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: News,
      translationType: NewsTranslation,
    });

    // Handle relatedNewsIds update
    if (input.relatedNewsIds !== undefined) {
      updatedEntity.relatedNewsIds = input.relatedNewsIds || [];
    } else {
      // Ensure it's always an array, even if not provided
      updatedEntity.relatedNewsIds = updatedEntity.relatedNewsIds || [];
    }
    await this.connection.getRepository(ctx, News).save(updatedEntity);

    return assertFound(this.findOne(ctx, updatedEntity.id, ['author', 'category']));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, News, id);
    try {
      await this.connection.getRepository(ctx, News).remove(entity);
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

  async assignNewsToChannel(
    ctx: RequestContext,
    input: AssignNewsToChannelInput,
  ): Promise<Array<Translated<News>>> {
    const news = await this.connection.getRepository(ctx, News).find({
      where: { id: In(input.newsIds) },
    });
    for (const item of news) {
      this.channelService.assignToChannels(ctx, News, item.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      news.map(p => p.id),
    );
  }

  async removeNewsFromChannel(
    ctx: RequestContext,
    input: RemoveNewsFromChannelInput,
  ): Promise<Array<Translated<News>>> {
    const news = await this.connection.getRepository(ctx, News).find({
      where: { id: In(input.newsIds) },
    });
    for (const item of news) {
      this.channelService.removeFromChannels(ctx, News, item.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      news.map(p => p.id),
    );
  }
}

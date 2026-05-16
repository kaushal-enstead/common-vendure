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
import { Header } from '../entities/header/header.entity';
import { HeaderTranslation } from '../entities/header/header-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateHeaderInput,
  UpdateHeaderInput,
  AssignHeadersToChannelInput,
  RemoveHeadersFromChannelInput,
} from '../gql/generated';

@Injectable()
export class HeaderService {
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
    headerIds: ID[],
    relations?: RelationPaths<Header>,
  ): Promise<Array<Translated<Header>>> {
    return this.connection
      .getRepository(ctx, Header)
      .find({ where: { id: In(headerIds) }, relations })
      .then(headers => {
        return headers.map(header => this.translator.translate(header, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Header>,
    relations?: RelationPaths<Header>,
  ): Promise<PaginatedList<Translated<Header>>> {
    return this.listQueryBuilder
      .build(Header, options, {
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
    relations?: RelationPaths<Header>,
  ): Promise<Translated<Header> | null> {
    return this.connection
      .getRepository(ctx, Header)
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

  /** Shop API: header must be assigned to the active channel. */
  findOneInCurrentChannel(
    ctx: RequestContext,
    id?: ID | null,
    code?: string | null,
    relations?: RelationPaths<Header>,
  ): Promise<Translated<Header> | null> {
    const hasId = id != null && String(id).length > 0;
    const hasCode = code != null && code !== '';

    const filter = hasId ? { id: { eq: id! } } : hasCode ? { code: { eq: code! } } : undefined;

    return this.listQueryBuilder
      .build(Header, { filter, take: 1 } as ListQueryOptions<Header>, {
        relations,
        ctx,
        channelId: ctx.channelId,
      })
      .getManyAndCount()
      .then(([items]) => {
        const entity = items[0];
        return entity ? this.translator.translate(entity, ctx) : null;
      });
  }

  async create(ctx: RequestContext, input: CreateHeaderInput): Promise<Translated<Header>> {
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
      entityType: Header,
      translationType: HeaderTranslation,
    });
    await this.channelService.assignToChannels(ctx, Header, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateHeaderInput): Promise<Translated<Header>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Header,
      translationType: HeaderTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Header, id);
    try {
      await this.connection.getRepository(ctx, Header).remove(entity);
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

  async assignHeadersToChannel(
    ctx: RequestContext,
    input: AssignHeadersToChannelInput,
  ): Promise<Array<Translated<Header>>> {
    const headers = await this.connection.getRepository(ctx, Header).find({
      where: { id: In(input.headerIds) },
    });
    for (const header of headers) {
      this.channelService.assignToChannels(ctx, Header, header.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      headers.map(p => p.id),
    );
  }

  async removeHeadersFromChannel(
    ctx: RequestContext,
    input: RemoveHeadersFromChannelInput,
  ): Promise<Array<Translated<Header>>> {
    const headers = await this.connection.getRepository(ctx, Header).find({
      where: { id: In(input.headerIds) },
    });
    for (const header of headers) {
      this.channelService.removeFromChannels(ctx, Header, header.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      headers.map(p => p.id),
    );
  }
}

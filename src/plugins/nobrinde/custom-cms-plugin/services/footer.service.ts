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
import { Footer } from '../entities/footer/footer.entity';
import { FooterTranslation } from '../entities/footer/footer-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateFooterInput,
  UpdateFooterInput,
  AssignFootersToChannelInput,
  RemoveFootersFromChannelInput,
} from '../gql/generated';

@Injectable()
export class FooterService {
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
    footerIds: ID[],
    relations?: RelationPaths<Footer>,
  ): Promise<Array<Translated<Footer>>> {
    return this.connection
      .getRepository(ctx, Footer)
      .find({ where: { id: In(footerIds) }, relations })
      .then(footers => {
        return footers.map(footer => this.translator.translate(footer, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Footer>,
    relations?: RelationPaths<Footer>,
  ): Promise<PaginatedList<Translated<Footer>>> {
    return this.listQueryBuilder
      .build(Footer, options, {
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
    relations?: RelationPaths<Footer>,
  ): Promise<Translated<Footer> | null> {
    return this.connection
      .getRepository(ctx, Footer)
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

  /** Shop API: footer must be assigned to the active channel. */
  findOneInCurrentChannel(
    ctx: RequestContext,
    id?: ID | null,
    code?: string | null,
    relations?: RelationPaths<Footer>,
  ): Promise<Translated<Footer> | null> {
    const hasId = id != null && String(id).length > 0;
    const hasCode = code != null && code !== '';

    const filter = hasId ? { id: { eq: id! } } : hasCode ? { code: { eq: code! } } : undefined;

    return this.listQueryBuilder
      .build(Footer, { filter, take: 1 } as ListQueryOptions<Footer>, {
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

  async create(ctx: RequestContext, input: CreateFooterInput): Promise<Translated<Footer>> {
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
      entityType: Footer,
      translationType: FooterTranslation,
    });
    await this.channelService.assignToChannels(ctx, Footer, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateFooterInput): Promise<Translated<Footer>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Footer,
      translationType: FooterTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Footer, id);
    try {
      await this.connection.getRepository(ctx, Footer).remove(entity);
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

  async assignFootersToChannel(
    ctx: RequestContext,
    input: AssignFootersToChannelInput,
  ): Promise<Array<Translated<Footer>>> {
    const footers = await this.connection.getRepository(ctx, Footer).find({
      where: { id: In(input.footerIds) },
    });
    for (const footer of footers) {
      this.channelService.assignToChannels(ctx, Footer, footer.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      footers.map(p => p.id),
    );
  }

  async removeFootersFromChannel(
    ctx: RequestContext,
    input: RemoveFootersFromChannelInput,
  ): Promise<Array<Translated<Footer>>> {
    const footers = await this.connection.getRepository(ctx, Footer).find({
      where: { id: In(input.footerIds) },
    });
    for (const footer of footers) {
      this.channelService.removeFromChannels(ctx, Footer, footer.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      footers.map(p => p.id),
    );
  }
}

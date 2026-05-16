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
import { Faq } from '../entities/faq/faq.entity';
import { FaqTranslation } from '../entities/faq/faq-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateFaqInput,
  UpdateFaqInput,
  AssignFaqsToChannelInput,
  RemoveFaqsFromChannelInput,
} from '../gql/generated';

@Injectable()
export class FaqService {
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
    faqIds: ID[],
    relations?: RelationPaths<Faq>,
  ): Promise<Array<Translated<Faq>>> {
    return this.connection
      .getRepository(ctx, Faq)
      .find({ where: { id: In(faqIds) }, relations })
      .then(faqs => {
        return faqs.map(faq => this.translator.translate(faq, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Faq>,
    relations?: RelationPaths<Faq>,
  ): Promise<PaginatedList<Translated<Faq>>> {
    return this.listQueryBuilder
      .build(Faq, options, {
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

  findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Faq>): Promise<Translated<Faq> | null> {
    return this.connection
      .getRepository(ctx, Faq)
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

  async create(ctx: RequestContext, input: CreateFaqInput): Promise<Translated<Faq>> {
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
      entityType: Faq,
      translationType: FaqTranslation,
    });

    await this.channelService.assignToChannels(ctx, Faq, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateFaqInput): Promise<Translated<Faq>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Faq,
      translationType: FaqTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Faq, id);
    try {
      await this.connection.getRepository(ctx, Faq).remove(entity);
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

  async assignFaqsToChannel(
    ctx: RequestContext,
    input: AssignFaqsToChannelInput,
  ): Promise<Array<Translated<Faq>>> {
    const faqs = await this.connection.getRepository(ctx, Faq).find({
      where: { id: In(input.faqIds) },
      // relations: ['channels'],
    });
    for (const faq of faqs) {
      this.channelService.assignToChannels(ctx, Faq, faq.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      faqs.map(p => p.id),
    );
  }

  async removeFaqsFromChannel(
    ctx: RequestContext,
    input: RemoveFaqsFromChannelInput,
  ): Promise<Array<Translated<Faq>>> {
    const faqs = await this.connection.getRepository(ctx, Faq).find({
      where: { id: In(input.faqIds) },
      // relations: ['channels'],
    });
    for (const faq of faqs) {
      this.channelService.removeFromChannels(ctx, Faq, faq.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      faqs.map(p => p.id),
    );
  }
}

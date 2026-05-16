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
import { Banner } from '../entities/banner/banner.entity';
import { BannerTranslation } from '../entities/banner/banner-translation.entity';
import { PluginInitOptions } from '../types';
import {
  CreateBannerInput,
  UpdateBannerInput,
  AssignBannersToChannelInput,
  RemoveBannersFromChannelInput,
} from '../gql/generated';

@Injectable()
export class BannerService {
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
    bannerIds: ID[],
    relations?: RelationPaths<Banner>,
  ): Promise<Array<Translated<Banner>>> {
    return this.connection
      .getRepository(ctx, Banner)
      .find({ where: { id: In(bannerIds) }, relations })
      .then(banners => {
        return banners.map(banner => this.translator.translate(banner, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Banner>,
    relations?: RelationPaths<Banner>,
  ): Promise<PaginatedList<Translated<Banner>>> {
    return this.listQueryBuilder
      .build(Banner, options, {
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
    relations?: RelationPaths<Banner>,
  ): Promise<Translated<Banner> | null> {
    return this.connection
      .getRepository(ctx, Banner)
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

  async create(ctx: RequestContext, input: CreateBannerInput): Promise<Translated<Banner>> {
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
      entityType: Banner,
      translationType: BannerTranslation,
    });
    await this.channelService.assignToChannels(ctx, Banner, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateBannerInput): Promise<Translated<Banner>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Banner,
      translationType: BannerTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Banner, id);
    try {
      await this.connection.getRepository(ctx, Banner).remove(entity);
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

  async assignBannersToChannel(
    ctx: RequestContext,
    input: AssignBannersToChannelInput,
  ): Promise<Array<Translated<Banner>>> {
    const banners = await this.connection.getRepository(ctx, Banner).find({
      where: { id: In(input.bannerIds) },
    });
    for (const banner of banners) {
      this.channelService.assignToChannels(ctx, Banner, banner.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      banners.map(p => p.id),
    );
  }

  async removeBannersFromChannel(
    ctx: RequestContext,
    input: RemoveBannersFromChannelInput,
  ): Promise<Array<Translated<Banner>>> {
    const banners = await this.connection.getRepository(ctx, Banner).find({
      where: { id: In(input.bannerIds) },
    });
    for (const banner of banners) {
      this.channelService.removeFromChannels(ctx, Banner, banner.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      banners.map(p => p.id),
    );
  }
}

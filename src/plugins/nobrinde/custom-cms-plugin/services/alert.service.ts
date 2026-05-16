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
  AssetService,
} from '@vendure/core';
import { In } from 'typeorm';
import { CMS_PLUGIN_OPTIONS } from '../constants';
import { Alert } from '../entities/alert/alert.entity';
import { AlertTranslation } from '../entities/alert/alert-translation.entity';
import { PluginInitOptions } from '../types';
// import {
//   CreateAlertInput,
//   UpdateAlertInput,
//   AssignAlertsToChannelInput,
//   RemoveAlertsFromChannelInput,
// } from '../gql/generated';

type CreateAlertInput = any;
type UpdateAlertInput = any;
type AssignAlertsToChannelInput = any;
type RemoveAlertsFromChannelInput = any;

@Injectable()
export class AlertService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private translatableSaver: TranslatableSaver,
    private translator: TranslatorService,
    private channelService: ChannelService,
    private assetService: AssetService,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  findByIds(
    ctx: RequestContext,
    alertIds: ID[],
    relations?: RelationPaths<Alert>,
  ): Promise<Array<Translated<Alert>>> {
    return this.connection
      .getRepository(ctx, Alert)
      .find({ where: { id: In(alertIds) }, relations })
      .then(alerts => {
        return alerts.map(alert => this.translator.translate(alert, ctx));
      });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Alert>,
    relations?: RelationPaths<Alert>,
  ): Promise<PaginatedList<Translated<Alert>>> {
    return this.listQueryBuilder
      .build(Alert, options, {
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

  findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Alert>): Promise<Translated<Alert> | null> {
    return this.connection
      .getRepository(ctx, Alert)
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

  async create(ctx: RequestContext, input: CreateAlertInput): Promise<Translated<Alert>> {
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
      entityType: Alert,
      translationType: AlertTranslation,
      beforeSave: async k => {
        await this.channelService.assignToCurrentChannel(k, ctx);
        // if (input.featuredAssetId) {
        //   await this.assetService.updateFeaturedAsset(ctx, k, input);
        // }
      },
    });
    // await this.channelService.assignToChannels(ctx, Alert, newEntity.id, [ctx.channelId]);
    // if (input.assetIds) {
    //   await this.assetService.updateEntityAssets(ctx, newEntity, input);
    // }
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateAlertInput): Promise<Translated<Alert>> {
    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Alert,
      translationType: AlertTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Alert, id);
    try {
      await this.connection.getRepository(ctx, Alert).remove(entity);
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

  async assignAlertsToChannel(
    ctx: RequestContext,
    input: AssignAlertsToChannelInput,
  ): Promise<Array<Translated<Alert>>> {
    const alerts = await this.connection.getRepository(ctx, Alert).find({
      where: { id: In(input.alertIds) },
    });
    for (const alert of alerts) {
      this.channelService.assignToChannels(ctx, Alert, alert.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      alerts.map(p => p.id),
    );
  }

  async removeAlertsFromChannel(
    ctx: RequestContext,
    input: RemoveAlertsFromChannelInput,
  ): Promise<Array<Translated<Alert>>> {
    const alerts = await this.connection.getRepository(ctx, Alert).find({
      where: { id: In(input.alertIds) },
    });
    for (const alert of alerts) {
      this.channelService.removeFromChannels(ctx, Alert, alert.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      alerts.map(p => p.id),
    );
  }
}

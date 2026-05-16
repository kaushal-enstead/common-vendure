import { Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
import {
  assertFound,
  AssetService,
  Channel,
  ChannelService,
  Collection,
  FacetValue,
  FacetValueService,
  idsAreEqual,
  Instrument,
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
  TranslatableSaver,
  Translated,
  TranslatorService,
} from '@vendure/core';
import { SlugValidator } from '@vendure/core/dist/service/helpers/slug-validator/slug-validator';
import { FindOptionsUtils, In, IsNull } from 'typeorm';
import { Kit, KitType } from '../entity/kit.entity';
import { KitTranslation } from '../entity/kit-translation.entity';
import { KitVariantService } from './kit-variant.service';
import {
  AssignKitsToChannelInput,
  CreateKitInput,
  RemoveKitsFromChannelInput,
  UpdateKitInput,
} from '../gql/generated';
import { KitVariant } from '../entity/kit-variant.entity';

/**
 * @description
 * Contains methods relating to {@link Kit} entities.
 *
 * @docsCategory services
 */
@Injectable()
@Instrument()
export class KitService {
  private readonly relations = ['featuredAsset', 'assets', 'channels', 'facetValues', 'facetValues.facet'];

  constructor(
    private connection: TransactionalConnection,
    private channelService: ChannelService,
    private assetService: AssetService,
    private kitVariantService: KitVariantService,
    private facetValueService: FacetValueService,
    private listQueryBuilder: ListQueryBuilder,
    private translatableSaver: TranslatableSaver,
    // private eventBus: EventBus,
    private slugValidator: SlugValidator,
    // private customFieldRelationService: CustomFieldRelationService,
    private translator: TranslatorService,
  ) {}

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Kit>,
    relations?: RelationPaths<Kit>,
  ): Promise<PaginatedList<Translated<Kit>>> {
    const effectiveRelations = relations || this.relations.slice();
    const customPropertyMap: { [name: string]: string } = {};
    const hasFacetValueIdFilter = this.listQueryBuilder.filterObjectHasProperty<any>(
      options?.filter,
      'facetValueId',
    );
    // const hasSkuFilter = this.listQueryBuilder.filterObjectHasProperty<KitFilterParameter>(
    //   options?.filter,
    //   'sku',
    // );
    if (hasFacetValueIdFilter) {
      effectiveRelations.push('facetValues');
      customPropertyMap.facetValueId = 'facetValues.id';
    }
    // if (hasSkuFilter) {
    //   effectiveRelations.push('variants');
    //   customPropertyMap.sku = 'variants.sku';
    // }

    return this.listQueryBuilder
      .build(Kit, options, {
        relations: effectiveRelations,
        channelId: ctx.channelId,
        where: { deletedAt: IsNull() },
        ctx,
        customPropertyMap,
      })
      .getManyAndCount()
      .then(async ([kits, totalItems]) => {
        const items = kits.map(kit =>
          this.translator.translate(kit, ctx, ['facetValues', ['facetValues', 'facet']]),
        );
        return {
          items,
          totalItems,
        };
      });
  }

  async findOne(
    ctx: RequestContext,
    kitId: ID,
    relations?: RelationPaths<Kit>,
  ): Promise<Translated<Kit> | undefined> {
    const effectiveRelations = relations ?? this.relations.slice();
    if (relations && effectiveRelations.includes('facetValues')) {
      // We need the facet to determine with the FacetValues are public
      // when serving via the Shop API.
      effectiveRelations.push('facetValues.facet');
    }
    const kit = await this.connection.findOneInChannel(ctx, Kit, kitId, ctx.channelId, {
      relations: unique(effectiveRelations),
      where: {
        deletedAt: IsNull(),
      },
    });
    if (!kit) {
      return;
    }
    return this.translator.translate(kit, ctx, ['facetValues', ['facetValues', 'facet']]);
  }

  async findByIds(
    ctx: RequestContext,
    kitIds: ID[],
    relations?: RelationPaths<Kit>,
  ): Promise<Array<Translated<Kit>>> {
    const qb = this.connection
      .getRepository(ctx, Kit)
      .createQueryBuilder('kit')
      .setFindOptions({ relations: (relations && false) || this.relations });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    FindOptionsUtils.joinEagerRelations(qb, qb.alias, qb.expressionMap.mainAlias!.metadata);
    return qb
      .leftJoin('kit.channels', 'channel')
      .andWhere('kit.deletedAt IS NULL')
      .andWhere('kit.id IN (:...ids)', { ids: kitIds })
      .andWhere('channel.id = :channelId', { channelId: ctx.channelId })
      .getMany()
      .then(kits => {
        return kits.map(kit =>
          this.translator.translate(kit, ctx, ['facetValues', ['facetValues', 'facet']]),
        );
      });
  }

  async getCollectionsForKit(ctx: RequestContext, kitId: ID, publicOnly: boolean): Promise<Collection[]> {
    const qb = this.connection
      .getRepository(ctx, Collection)
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.translations', 'translation')
      .leftJoin('collection.productVariants', 'variant')
      .leftJoin('kit_variant', 'kv', 'kv.variantId = collectionVariant.id')
      .where('kv.kitId = :kitId', { kitId })
      .groupBy('collection.id, translation.id')
      .orderBy('collection.id', 'ASC');

    if (publicOnly) {
      qb.andWhere('collection.isPrivate = :isPrivate', { isPrivate: false });
    }
    const result = await qb.getMany();

    return result.map(collection => this.translator.translate(collection, ctx));
  }

  /**
   * @description
   * Returns all Channels to which the Kit is assigned.
   */
  async getKitChannels(ctx: RequestContext, kitId: ID): Promise<Channel[]> {
    const kit = await this.connection.getEntityOrThrow(ctx, Kit, kitId, {
      relations: ['channels'],
      channelId: ctx.channelId,
    });
    return kit.channels;
  }

  getFacetValuesForKit(ctx: RequestContext, kitId: ID): Promise<Array<Translated<FacetValue>>> {
    return this.connection
      .getRepository(ctx, Kit)
      .findOne({
        where: { id: kitId },
        relations: ['facetValues'],
      })
      .then(kit => {
        if (!kit) {
          return [];
        }
        return kit.facetValues.map(o => this.translator.translate(o, ctx, ['facet']));
      });
  }

  async findOneBySlug(
    ctx: RequestContext,
    slug: string,
    relations?: RelationPaths<Kit>,
  ): Promise<Translated<Kit> | undefined> {
    const qb = this.connection.getRepository(ctx, Kit).createQueryBuilder('kit');
    const translationQb = this.connection
      .getRepository(ctx, KitTranslation)
      .createQueryBuilder('_kit_translation')
      .select('_kit_translation.baseId')
      .andWhere('_kit_translation.slug = :slug', { slug });

    qb.leftJoin('kit.translations', 'translation')
      .leftJoin('kit.channels', 'channel')
      .andWhere('kit.deletedAt IS NULL')
      .andWhere('channel.id = :channelId', { channelId: ctx.channelId })
      .andWhere('kit.id IN (' + translationQb.getQuery() + ')')
      .setParameters(translationQb.getParameters())
      .select('kit.id', 'id')
      .addSelect(
        // eslint-disable-next-line max-len
        `CASE translation.languageCode WHEN '${ctx.languageCode}' THEN 2 WHEN '${ctx.channel.defaultLanguageCode}' THEN 1 ELSE 0 END`,
        'sort_order',
      )
      .orderBy('sort_order', 'DESC');
    // We use getRawOne here to simply get the ID as efficiently as possible,
    // which we then pass to the regular findOne() method which will handle
    // all the joins etc.
    const result = await qb.getRawOne();
    if (result) {
      return this.findOne(ctx, result.id, relations);
    } else {
      return undefined;
    }
  }

  async create(ctx: RequestContext, input: CreateKitInput): Promise<Translated<Kit>> {
    await this.slugValidator.validateSlugs(ctx, input, KitTranslation);
    const kitType = ctx.apiType === 'admin' ? KitType.Admin : KitType.Customer;
    const kit = await this.translatableSaver.create({
      ctx,
      input,
      entityType: Kit,
      translationType: KitTranslation,
      beforeSave: async k => {
        await this.channelService.assignToCurrentChannel(k, ctx);
        if (input.facetValueIds) {
          k.facetValues = await this.facetValueService.findByIds(ctx, input.facetValueIds);
        }
        await this.assetService.updateFeaturedAsset(ctx, k, input);
      },
    });
    kit.type = kitType;
    // kit.discount = input.discount || 0;
    await this.connection.getRepository(ctx, Kit).save(kit);

    // await this.customFieldRelationService.updateRelations(ctx, Kit, input, kit);
    await this.assetService.updateEntityAssets(ctx, kit, input);
    // await this.eventBus.publish(new KitEvent(ctx, kit, 'created', input));

    return assertFound(this.findOne(ctx, kit.id));
  }

  async update(ctx: RequestContext, input: UpdateKitInput): Promise<Translated<Kit>> {
    const kit = await this.connection.getEntityOrThrow(ctx, Kit, input.id, {
      channelId: ctx.channelId,
      relations: ['facetValues', 'facetValues.channels'],
    });
    await this.slugValidator.validateSlugs(ctx, input, KitTranslation);
    const updatedKit = await this.translatableSaver.update({
      ctx,
      input,
      entityType: Kit,
      translationType: KitTranslation,
      beforeSave: async p => {
        if (input.facetValueIds) {
          const facetValuesInOtherChannels = kit.facetValues.filter(fv =>
            fv.channels.every(channel => !idsAreEqual(channel.id, ctx.channelId)),
          );
          p.facetValues = [
            ...facetValuesInOtherChannels,
            ...(await this.facetValueService.findByIds(ctx, input.facetValueIds)),
          ];
        }
        await this.assetService.updateFeaturedAsset(ctx, p, input);
        await this.assetService.updateEntityAssets(ctx, p, input);
      },
    });
    // await this.customFieldRelationService.updateRelations(ctx, Kit, input, updatedKit);
    // await this.eventBus.publish(new KitEvent(ctx, updatedKit, 'updated', input));

    return assertFound(this.findOne(ctx, updatedKit.id));
  }

  async softDelete(ctx: RequestContext, kitId: ID): Promise<DeletionResponse> {
    const kit = await this.connection.getEntityOrThrow(ctx, Kit, kitId, {
      relationLoadStrategy: 'query',
      loadEagerRelations: false,
      channelId: ctx.channelId,
      relations: ['variants'],
    });
    kit.deletedAt = new Date();
    await this.connection.getRepository(ctx, Kit).save(kit, { reload: false });
    // await this.eventBus.publish(new KitEvent(ctx, kit, 'deleted', kitId));

    const variantResult = await this.kitVariantService.softDelete(
      ctx,
      kit.variants.map(v => v.id),
    );
    if (variantResult.result === DeletionResult.NOT_DELETED) {
      await this.connection.rollBackTransaction(ctx);
      return variantResult;
    }
    return {
      result: DeletionResult.DELETED,
    };
  }

  /**
   * @description
   * Assigns a Kit to the specified Channel, and optionally uses a `priceFactor` to set the KitVariantPrices
   * on the new Channel.
   *
   * Internally, this method will also call {@link KitVariantService} `assignKitVariantsToChannel()` for
   * each of the Kit's variants, and will assign the Kit's Assets to the Channel too.
   */
  async assignKitsToChannel(
    ctx: RequestContext,
    input: AssignKitsToChannelInput,
  ): Promise<Array<Translated<Kit>>> {
    const kitsWithVariants = await this.connection.getRepository(ctx, Kit).find({
      where: { id: In(input.kitIds) },
      relations: ['variants', 'assets'],
    });
    const assetIds: ID[] = unique(
      ([] as ID[]).concat(...kitsWithVariants.map(p => p.assets.map(a => a.assetId))),
    );
    await this.assetService.assignToChannel(ctx, { channelId: input.channelId, assetIds });
    const kits = await this.connection.getRepository(ctx, Kit).find({ where: { id: In(input.kitIds) } });
    for (const kit of kits) {
      // await this.eventBus.publish(new KitChannelEvent(ctx, kit, input.channelId, 'assigned'));
    }
    return this.findByIds(
      ctx,
      kitsWithVariants.map(p => p.id),
    );
  }

  async removeKitsFromChannel(
    ctx: RequestContext,
    input: RemoveKitsFromChannelInput,
  ): Promise<Array<Translated<Kit>>> {
    const kitsWithVariants = await this.connection.getRepository(ctx, Kit).find({
      where: { id: In(input.kitIds) },
      relations: ['variants'],
    });
    const kits = await this.connection.getRepository(ctx, Kit).find({ where: { id: In(input.kitIds) } });
    return this.findByIds(
      ctx,
      kitsWithVariants.map(p => p.id),
    );
  }
}

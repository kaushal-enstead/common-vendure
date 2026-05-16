import { Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
import {
  Instrument,
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { In } from 'typeorm';
import { KitVariant } from '../entity/kit-variant.entity';
import { CreateKitVariantInput, UpdateKitVariantInput } from '../gql/generated';

/**
 * @description
 * Contains methods relating to {@link KitVariant} entities.
 *
 * @docsCategory services
 */
@Injectable()
@Instrument()
export class KitVariantService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<KitVariant>,
  ): Promise<PaginatedList<KitVariant>> {
    const relations = ['productVariant'];
    const customPropertyMap: { [name: string]: string } = {};
    return this.listQueryBuilder
      .build(KitVariant, options, {
        relations,
        // where: { deletedAt: IsNull() },
        ctx,
        customPropertyMap,
      })
      .getManyAndCount()
      .then(([variants, totalItems]) => {
        return {
          items: variants,
          totalItems,
        };
      });
  }

  findOne(
    ctx: RequestContext,
    kitVariantId: ID,
    relations?: RelationPaths<KitVariant>,
  ): Promise<KitVariant | null> {
    return this.connection
      .getRepository(ctx, KitVariant)
      .findOne({
        where: { id: kitVariantId },
        relations,
      })
      .then(result => result);
  }

  findByIds(
    ctx: RequestContext,
    ids: ID[],
    relations?: RelationPaths<KitVariant>,
  ): Promise<Array<KitVariant>> {
    return this.connection
      .getRepository(ctx, KitVariant)
      .find({
        where: { id: In(ids) },
        relations: relations || ['productVariant'],
      })
      .then(result => result);
  }

  getVariantsByKitId(
    ctx: RequestContext,
    kitId: ID,
    options: ListQueryOptions<KitVariant> = {},
    relations?: RelationPaths<KitVariant>,
  ): Promise<PaginatedList<KitVariant>> {
    const qb = this.listQueryBuilder
      .build(KitVariant, options, {
        relations: [...(relations || ['productVariant'])],
        orderBy: { id: 'ASC' },
        // where: { kitId },
        ctx,
      })
      .innerJoinAndSelect('kitvariant.kit', 'kit', 'kit.id = :kitId', {
        kitId,
      });

    // if (ctx.apiType === 'shop') {
    //   qb.andWhere('kitvariant.enabled = :enabled', { enabled: true });
    // }

    return qb.getManyAndCount().then(async ([variants, totalItems]) => {
      return {
        items: variants,
        totalItems,
      };
    });
  }

  /**
   * @description
   * Returns a {@link PaginatedList} of all KitVariants associated with the given Collection.
   */
  getVariantsByCollectionId(
    ctx: RequestContext,
    collectionId: ID,
    options: ListQueryOptions<KitVariant>,
    relations: RelationPaths<KitVariant> = [],
  ): Promise<PaginatedList<KitVariant>> {
    const qb = this.listQueryBuilder
      .build(KitVariant, options, {
        relations: unique([...relations, 'productVariant']),
        // channelId: ctx.channelId,
        ctx,
      })
      .leftJoin('kitvariant.productVariant', 'productVariant')

      .leftJoin('variant.collections', 'collection')
      .leftJoin('variant.product', 'product')
      .andWhere('product.deletedAt IS NULL')
      .andWhere('variant.deletedAt IS NULL')
      .andWhere('collection.id = :collectionId', { collectionId });

    // if (options && options.filter && options.filter.enabled && options.filter.enabled.eq === true) {
    //   qb.andWhere('product.enabled = :enabled', { enabled: true });
    // }

    return qb.getManyAndCount().then(async ([variants, totalItems]) => {
      return {
        items: variants,
        totalItems,
      };
    });
  }

  async create(ctx: RequestContext, input: CreateKitVariantInput[]): Promise<Array<KitVariant>> {
    const ids: ID[] = [];
    for (const kitVariantInput of input) {
      const id = await this.createSingle(ctx, kitVariantInput);
      ids.push(id);
    }
    const createdVariants = await this.findByIds(ctx, ids);
    // await this.eventBus.publish(new KitVariantEvent(ctx, createdVariants, 'created', input));
    return createdVariants;
  }

  async update(ctx: RequestContext, input: UpdateKitVariantInput[]): Promise<Array<KitVariant>> {
    for (const productInput of input) {
      await this.updateSingle(ctx, productInput);
    }
    const updatedVariants = await this.findByIds(
      ctx,
      input.map(i => i.id),
    );
    // await this.eventBus.publish(new KitVariantEvent(ctx, updatedVariants, 'updated', input));
    return updatedVariants;
  }

  private async createSingle(ctx: RequestContext, input: CreateKitVariantInput): Promise<ID> {
    const createdVariant = await this.connection.getRepository(ctx, KitVariant).save(
      new KitVariant({
        ...input,
        kit: { id: input.kitId },
        productVariant: { id: input.productVariantId },
      }),
    );
    return createdVariant.id;
  }

  private async updateSingle(ctx: RequestContext, input: UpdateKitVariantInput): Promise<ID> {
    const existingVariant = await this.connection.getEntityOrThrow(ctx, KitVariant, input.id, {
      relations: ['productVariant'],
    });
    const updatedVariant = await this.connection.getRepository(ctx, KitVariant).save(
      new KitVariant({
        // ...existingVariant,
        ...input,
        // kit: { id: input.kitId },
        // productVariant: { id: input.productVariantId },
      }),
    );
    return updatedVariant.id;
  }

  async softDelete(ctx: RequestContext, id: ID | ID[]): Promise<DeletionResponse> {
    const ids = Array.isArray(id) ? id : [id];
    await this.connection.getRepository(ctx, KitVariant).delete({ id: In(ids) });
    // await this.eventBus.publish(new KitVariantEvent(ctx, variants, 'deleted', id));
    return {
      result: DeletionResult.DELETED,
    };
  }
}

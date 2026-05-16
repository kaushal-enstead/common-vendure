import { Injectable } from '@nestjs/common';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { NobrindeOrder, NobrindeOrderLine } from '../entities/nobrinde-orders';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class NobrindeOrderService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<NobrindeOrder>,
    relations?: RelationPaths<NobrindeOrder>,
  ): Promise<PaginatedList<NobrindeOrder>> {
    const effectiveRelations = relations;
    return this.listQueryBuilder
      .build(NobrindeOrder, options, {
        relations: effectiveRelations,
        // channelId: ctx.channelId,
        // where: { deletedAt: IsNull() },
        ctx,
        // customPropertyMap,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  async findOne(ctx: RequestContext, id: ID): Promise<NobrindeOrder | null> {
    const repo = this.connection.getRepository(ctx, NobrindeOrder);
    return repo.findOne({ where: { id } as FindOptionsWhere<NobrindeOrder> });
  }

  async getLinesForOrder(ctx: RequestContext, order: NobrindeOrder): Promise<NobrindeOrderLine[]> {
    const lineRepo = this.connection.getRepository(ctx, NobrindeOrderLine);
    return lineRepo.find({
      where: { order: { id: order.id } },
      order: { ordem: 'ASC' },
    });
  }
}

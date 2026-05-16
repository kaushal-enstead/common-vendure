import { Injectable } from '@nestjs/common';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { NobrindeSaleUser } from '../entities/nobrinde-sale-users';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class NobrindeSaleUserService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<NobrindeSaleUser>,
    relations?: RelationPaths<NobrindeSaleUser>,
  ): Promise<PaginatedList<NobrindeSaleUser>> {
    return this.listQueryBuilder
      .build(NobrindeSaleUser, options ?? {}, {
        relations: relations ?? undefined,
        ctx,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => ({ items, totalItems }));
  }

  async findOne(ctx: RequestContext, id: ID): Promise<NobrindeSaleUser | null> {
    const repo = this.connection.getRepository(ctx, NobrindeSaleUser);
    return repo.findOne({ where: { id } as FindOptionsWhere<NobrindeSaleUser> });
  }
}

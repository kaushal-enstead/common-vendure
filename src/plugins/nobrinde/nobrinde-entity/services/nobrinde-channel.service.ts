import { Injectable } from '@nestjs/common';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { NobrindeChannel } from '../entities/nobrinde-channels';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class NobrindeChannelService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<NobrindeChannel>,
    relations?: RelationPaths<NobrindeChannel>,
  ): Promise<PaginatedList<NobrindeChannel>> {
    return this.listQueryBuilder
      .build(NobrindeChannel, options ?? {}, {
        relations: relations ?? undefined,
        ctx,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => ({ items, totalItems }));
  }

  async findOne(ctx: RequestContext, id: ID): Promise<NobrindeChannel | null> {
    const repo = this.connection.getRepository(ctx, NobrindeChannel);
    return repo.findOne({ where: { id } as FindOptionsWhere<NobrindeChannel> });
  }
}

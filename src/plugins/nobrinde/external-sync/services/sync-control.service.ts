import { Injectable } from '@nestjs/common';
import {
  Channel,
  ListQueryBuilder,
  ListQueryOptions,
  PaginatedList,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { SyncTable } from '../entities/sync-table';
import { NobrindeChannel } from '../../nobrinde-entity/entities/nobrinde-channels';
import { Not, In } from 'typeorm';

@Injectable()
export class SyncControlService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async getAvailableNobrindeChannels(
    ctx: RequestContext,
    currentChannelId?: string,
    options?: ListQueryOptions<NobrindeChannel>,
    relations?: RelationPaths<NobrindeChannel>,
  ): Promise<PaginatedList<NobrindeChannel>> {
    const channelRepo = this.connection.getRepository(ctx, Channel);
    const channels = await channelRepo.find();
    const currentChannelInfo = channels.find(c => c.id === currentChannelId);
    const occupiedChannelIds = channels
      .map(c => String(c.customFields?.nobrinde_channel_id))
      .filter(id => id != null && id !== '');

    // Ensure comparison is between same type (string <-> string)
    return this.listQueryBuilder
      .build(NobrindeChannel, options, {
        relations,
        ctx,
        where: {
          id: Not(
            In(
              occupiedChannelIds.filter(
                id =>
                  // safely coerce current value to string for comparison
                  id !== String(currentChannelInfo?.customFields?.nobrinde_channel_id ?? ''),
              ),
            ),
          ),
        },
      })
      .getManyAndCount()
      .then(([items, totalItems]) => ({
        items,
        totalItems,
      }));

    // const allNc = await ncRepo.find({
    //   select: ['id', 'name', 'slug'],
    //   where: {
    //     id: Not(In(occupiedChannelIds)),
    //   },
    // });

    // const filter = options?.filter;
    // let filtered = allNc;
    // if (filter?.name?.contains != null) {
    //   const term = filter.name.contains.toLowerCase();
    //   filtered = filtered.filter(
    //     nc => nc.name?.toLowerCase().includes(term) || nc.slug?.toLowerCase().includes(term),
    //   );
    // }
    // if (filter?.slug?.contains != null) {
    //   const term = filter.slug.contains.toLowerCase();
    //   filtered = filtered.filter(
    //     nc => nc.slug?.toLowerCase().includes(term) || nc.name?.toLowerCase().includes(term),
    //   );
    // }

    // const totalItems = filtered.length;
    // const skip = options?.skip ?? 0;
    // const take = options?.take ?? 50;
    // const items = filtered.slice(skip, skip + take).map(nc => ({
    //   id: String(nc.id),
    //   name: nc.name ?? '',
    //   slug: nc.slug ?? '',
    // }));

    // return { items, totalItems };
  }

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<SyncTable>,
    relations?: RelationPaths<SyncTable>,
  ) {
    return this.listQueryBuilder
      .build(SyncTable, options, {
        relations,
        ctx,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => ({
        items,
        totalItems,
      }));
  }

  async findOne(ctx: RequestContext, id: string): Promise<SyncTable | null> {
    const repo = this.connection.getRepository(ctx, SyncTable);
    return repo.findOne({ where: { id } });
  }

  async updateLastSyncedAt(ctx: RequestContext, id: string, lastSyncedAt: Date | null): Promise<SyncTable> {
    const repo = this.connection.getRepository(ctx, SyncTable);
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      throw new Error('SyncTable not found');
    }
    row.lastSyncedAt = lastSyncedAt;
    return repo.save(row);
  }
}

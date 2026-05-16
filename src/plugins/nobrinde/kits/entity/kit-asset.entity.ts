import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Kit } from './kit.entity';
import { OrderableAsset } from '@vendure/core';

@Entity()
export class KitAsset extends OrderableAsset {
  constructor(input?: DeepPartial<KitAsset>) {
    super(input);
  }
  @Column()
  kitId: ID;

  @Index()
  @ManyToOne(type => Kit, kit => kit.assets, { onDelete: 'CASCADE' })
  kit: Kit;
}

import { Channel, ChannelAware, DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToMany, JoinTable } from 'typeorm';

export class CategoryCustomFields {}

export type CategoryType = 'news' | 'authors' | 'faq';

@Entity('payload_category')
export class Category extends VendureEntity implements ChannelAware {
  constructor(input?: DeepPartial<Category>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  type: CategoryType;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

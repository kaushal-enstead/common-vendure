import { Channel, ChannelAware, DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { PageBlock } from './page-block.entity';

export interface PageSeo {
  title?: string | null;
  image?: string | null;
  description?: string | null;
}

@Entity('payload_page')
export class Page extends VendureEntity implements ChannelAware {
  constructor(input?: DeepPartial<Page>) {
    super(input);
  }

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  slug: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'json', nullable: true })
  seo: PageSeo | null;

  @OneToMany(type => PageBlock, block => block.page, { cascade: true, eager: false })
  blocks: PageBlock[];

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

import {
  Channel,
  ChannelAware,
  DeepPartial,
  LocaleString,
  Translatable,
  Translation,
  VendureEntity,
} from '@vendure/core';
import { Column, Entity, Index, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BannerTranslation } from './banner-translation.entity';

export class BannerCustomFields {}

export interface BannerItemButton {
  label: string;
  type: 'external' | 'internal';
  openInNewTab: boolean;
  url?: string;
  linkRef?: {
    entity: string;
    value: string;
  };
}

export interface BannerItem {
  name: string;
  description?: string;
  assetId: string;
  index: number;
  button?: BannerItemButton;
}

@Entity('payload_banner')
export class Banner extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Banner>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  title: LocaleString;
  items: BannerItem[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(type => BannerTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Banner>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

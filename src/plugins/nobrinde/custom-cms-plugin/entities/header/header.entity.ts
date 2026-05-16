import { Channel, ChannelAware, DeepPartial, Translatable, Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { HeaderTranslation } from './header-translation.entity';

export class HeaderCustomFields {}

export interface NavLinkItemValue {
  label: string;
  type: 'external' | 'internal';
  openInNewTab: boolean;
  url?: string;
  linkRef?: {
    entity: string;
    value: string;
  };
  active: boolean;
}

export interface NavLinkItem {
  label: string;
  active: boolean;
  link?: Omit<NavLinkItemValue, 'active'>; // Optional link for parent item
  children?: NavLinkItemValue[]; // Optional children
}

@Entity('payload_header')
export class Header extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Header>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string; // Asset ID or URL

  @OneToMany(type => HeaderTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Header>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];

  navLinks: NavLinkItem[];
}

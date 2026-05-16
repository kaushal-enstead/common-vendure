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
import { FooterTranslation } from './footer-translation.entity';

export class FooterCustomFields {}

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
  children: NavLinkItemValue[];
}

export interface SocialLinkItem {
  label: string;
  image: string;
  url: string;
  active: boolean;
}

@Entity('payload_footer')
export class Footer extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Footer>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @OneToMany(type => FooterTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Footer>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];

  navLinks: NavLinkItem[];
  socialLinks: SocialLinkItem[];
}

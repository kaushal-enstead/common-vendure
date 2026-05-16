import {
  Asset,
  Channel,
  ChannelAware,
  DeepPartial,
  EntityId,
  ID,
  LocaleString,
  Translatable,
  Translation,
  VendureEntity,
} from '@vendure/core';
import { Column, Entity, Index, ManyToMany, JoinTable, OneToMany, ManyToOne } from 'typeorm';
import { AlertTranslation } from './alert-translation.entity';

export class AlertCustomFields {}

export interface AlertButton {
  label: string;
  type: 'external' | 'internal';
  openInNewTab: boolean;
  url?: string;
  linkRef?: {
    entity: string;
    value: string;
  };
}

@Entity('payload_alert')
export class Alert extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Alert>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Index()
  @ManyToOne(type => Asset, { onDelete: 'SET NULL' })
  asset: Asset;

  @EntityId({ nullable: true })
  assetId: ID;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(type => AlertTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Alert>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];

  title: LocaleString;
  content: LocaleString;
  targetUrls: string[];
  button?: AlertButton;
}

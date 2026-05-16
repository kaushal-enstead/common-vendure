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
import { FaqTranslation } from './faq-translation.entity';

export class FaqCustomFields {}

export interface FaqItem {
  question: string;
  explanation: string;
  index: number;
}

@Entity('payload_faq')
export class Faq extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Faq>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  title: LocaleString;
  items: FaqItem[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(type => FaqTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Faq>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

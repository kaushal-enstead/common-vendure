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
import { DocumentTranslation } from './document-translation.entity';

export class DocumentCustomFields {}

export interface DocumentItem {
  name: string;
  assetId: string;
  index: number;
}

@Entity('payload_document')
export class Document extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Document>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  title: LocaleString;
  items: DocumentItem[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(type => DocumentTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Document>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

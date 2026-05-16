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
import { AuthorTranslation } from './author-translation.entity';

export class AuthorCustomFields {}

@Entity('payload_author')
export class Author extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<Author>) {
    super(input);
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string; // Asset ID or URL

  title: LocaleString;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(type => AuthorTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Author>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

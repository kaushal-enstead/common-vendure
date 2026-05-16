import {
  Channel,
  ChannelAware,
  DeepPartial,
  LocaleString,
  Translatable,
  Translation,
  VendureEntity,
} from '@vendure/core';
import { Column, Entity, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { NewsTranslation } from './news-translation.entity';
import { Author } from '../author/author.entity';
import { Category } from '../category/category.entity';

export class NewsCustomFields {}

export interface NewsSeo {
  title: string;
  image: string; // Asset ID or URL
  description: string;
}

@Entity('payload_news')
export class News extends VendureEntity implements Translatable, ChannelAware {
  constructor(input?: DeepPartial<News>) {
    super(input);
  }

  title: LocaleString;
  description: LocaleString;

  @Column({ type: 'varchar', length: 500, nullable: true })
  src: string; // Asset ID or URL

  @Column({ type: 'varchar', length: 36, nullable: true })
  authorId: string | null;

  @ManyToOne(() => Author, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: Author | null;

  @Column({ type: 'simple-array', nullable: true })
  relatedNewsIds: string[]; // Array of News IDs

  @Column({ type: 'json', nullable: true })
  seo: NewsSeo | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @OneToMany(type => NewsTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<News>>;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}

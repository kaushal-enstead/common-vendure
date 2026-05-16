import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { News } from './news.entity';

@Entity('payload_news_translation')
export class NewsTranslation extends VendureEntity implements Translation<News> {
  constructor(input?: DeepPartial<Translation<News>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @ManyToOne(type => News, base => base.translations, { onDelete: 'CASCADE' })
  base: News;
}

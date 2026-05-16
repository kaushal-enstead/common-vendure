import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { Faq, FaqItem } from './faq.entity';

@Entity('payload_faq_translation')
export class FaqTranslation extends VendureEntity implements Translation<Faq> {
  constructor(input?: DeepPartial<Translation<Faq>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'varchar', length: 1024 })
  title: string;

  @Column({ type: 'json', nullable: true })
  items: FaqItem[];

  @Index()
  @ManyToOne(type => Faq, base => base.translations, { onDelete: 'CASCADE' })
  base: Faq;
}

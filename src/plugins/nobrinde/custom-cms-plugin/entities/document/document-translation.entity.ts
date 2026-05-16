import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { Document, DocumentItem } from './document.entity';

@Entity('payload_document_translation')
export class DocumentTranslation extends VendureEntity implements Translation<Document> {
  constructor(input?: DeepPartial<Translation<Document>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'varchar', length: 1024 })
  title: string;

  @Column({ type: 'json', nullable: true })
  items: DocumentItem[];

  @Index()
  @ManyToOne(type => Document, base => base.translations, { onDelete: 'CASCADE' })
  base: Document;
}

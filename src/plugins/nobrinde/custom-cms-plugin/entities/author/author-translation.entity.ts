import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Author } from './author.entity';

@Entity('payload_author_translation')
export class AuthorTranslation extends VendureEntity implements Translation<Author> {
  constructor(input?: DeepPartial<Translation<Author>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Index()
  @ManyToOne(type => Author, base => base.translations, { onDelete: 'CASCADE' })
  base: Author;
}

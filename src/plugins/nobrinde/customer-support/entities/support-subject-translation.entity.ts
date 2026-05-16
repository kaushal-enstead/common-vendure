import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { SupportSubject } from './support-subject.entity';

@Entity()
export class SupportSubjectTranslation extends VendureEntity implements Translation<SupportSubject> {
  constructor(input?: DeepPartial<Translation<SupportSubjectTranslation>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column() name: string;

  @Column('text') description: string;

  @Index()
  @ManyToOne(type => SupportSubject, base => base.translations, { onDelete: 'CASCADE' })
  base: SupportSubject;
}

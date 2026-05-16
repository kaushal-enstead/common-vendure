import {
  DeepPartial,
  HasCustomFields,
  LocaleString,
  Translatable,
  Translation,
  VendureEntity,
} from '@vendure/core';
import { Column, Entity, OneToMany } from 'typeorm';

import { SupportSubjectTranslation } from './support-subject-translation.entity';

@Entity()
export class SupportSubject extends VendureEntity implements Translatable {
  constructor(input?: DeepPartial<SupportSubject>) {
    super(input);
  }

  @Column()
  code: string;

  @Column({ default: true })
  isActive: boolean;

  name: LocaleString;
  description: LocaleString;

  @OneToMany(type => SupportSubjectTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<SupportSubject>>;
}

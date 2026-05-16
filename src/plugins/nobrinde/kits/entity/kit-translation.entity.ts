import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { Kit } from './kit.entity';
import { Translation, VendureEntity } from '@vendure/core';

@Entity()
export class KitTranslation extends VendureEntity implements Translation<Kit> {
  constructor(input?: DeepPartial<Translation<Kit>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column() name: string;

  @Index({ unique: false })
  @Column()
  slug: string;

  @Column('text') description: string;

  @Index()
  @ManyToOne(type => Kit, base => base.translations)
  base: Kit;
}

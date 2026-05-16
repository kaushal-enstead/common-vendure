import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { Banner, BannerItem } from './banner.entity';

@Entity('payload_banner_translation')
export class BannerTranslation extends VendureEntity implements Translation<Banner> {
  constructor(input?: DeepPartial<Translation<Banner>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'varchar', length: 1024 })
  title: string;

  @Column({ type: 'json', nullable: true })
  items: BannerItem[];

  @Index()
  @ManyToOne(type => Banner, base => base.translations, { onDelete: 'CASCADE' })
  base: Banner;
}

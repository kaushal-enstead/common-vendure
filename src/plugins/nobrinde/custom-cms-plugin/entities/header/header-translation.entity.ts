import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Header, NavLinkItem } from './header.entity';

@Entity('payload_header_translation')
export class HeaderTranslation extends VendureEntity implements Translation<Header> {
  constructor(input?: DeepPartial<Translation<Header>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'json', nullable: true })
  navLinks: NavLinkItem[];

  @Index()
  @ManyToOne(type => Header, base => base.translations, { onDelete: 'CASCADE' })
  base: Header;
}

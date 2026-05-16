import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Footer, NavLinkItem, SocialLinkItem } from './footer.entity';

@Entity('payload_footer_translation')
export class FooterTranslation extends VendureEntity implements Translation<Footer> {
  constructor(input?: DeepPartial<Translation<Footer>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'json', nullable: true })
  navLinks: NavLinkItem[];

  @Column({ type: 'json', nullable: true })
  socialLinks: SocialLinkItem[];

  @Index()
  @ManyToOne(type => Footer, base => base.translations, { onDelete: 'CASCADE' })
  base: Footer;
}

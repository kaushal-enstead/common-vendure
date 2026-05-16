import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { PageBlock, PageBlockColumn } from './page-block.entity';

@Entity('payload_page_block_translation')
export class PageBlockTranslation extends VendureEntity implements Translation<PageBlock> {
  constructor(input?: DeepPartial<Translation<PageBlock>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'json', nullable: true })
  columns: PageBlockColumn[];

  @Index()
  @ManyToOne(type => PageBlock, base => base.translations, { onDelete: 'CASCADE' })
  base: PageBlock;
}

import { DeepPartial, LocaleString, Translatable, Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PageBlockTranslation } from './page-block-translation.entity';
import { Page } from './page.entity';

export type ColumnType =
  | 'video'
  | 'image'
  | 'cta'
  | 'content'
  | 'stats'
  | 'faq'
  | 'document'
  | 'banner'
  | 'news'
  | 'authors'
  | 'collections'
  | 'kits'
  | 'productVariants';

export type PageBlockEntityFilterCombinator = 'AND' | 'OR';

export interface PageBlockEntityFilterCondition {
  field: string;
  operator: 'eq' | 'gte';
  value: string | boolean | number;
}

export interface PageBlockEntityFilters {
  combinator: PageBlockEntityFilterCombinator;
  conditions: PageBlockEntityFilterCondition[];
}

export interface ColumnCss extends Record<string, any> {
  width?: number; // Percentage (0-100)
  // All other CSS properties can be added as key-value pairs
}

export interface ColumnButton {
  label: string;
  type: 'external' | 'internal';
  openInNewTab: boolean;
  url?: string;
  linkRef?: {
    entity: string;
    value: string;
  };
}

// Union type for column data based on column type
export type ColumnData =
  | { type: 'video'; label?: string; url?: string }
  | { type: 'image'; label?: string; url?: string; title?: string; subtitle?: string; button?: ColumnButton }
  | { type: 'cta'; title?: string; description?: string; button?: ColumnButton }
  | { type: 'content'; description?: string }
  | { type: 'stats'; items?: Array<{ label: string; value: string }> }
  | { type: 'faq'; itemId: string }
  | { type: 'document'; itemId: string }
  | { type: 'banner'; itemId: string }
  | {
      type: 'news' | 'authors' | 'collections' | 'kits' | 'productVariants';
      filters: PageBlockEntityFilters;
    };

export interface PageBlockColumn {
  type: ColumnType;
  label?: string;
  css: ColumnCss;
  data: ColumnData;
}

@Entity('payload_page_block')
export class PageBlock extends VendureEntity implements Translatable {
  constructor(input?: DeepPartial<PageBlock>) {
    super(input);
  }

  @Column({ type: 'varchar', length: 36 })
  pageId: string;

  @ManyToOne(() => Page, page => page.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page: Page;

  @Column({ type: 'varchar', length: 255, nullable: true })
  code: string;

  @Column({ type: 'int', default: 0 })
  index: number; // For ordering blocks

  @Column({ type: 'boolean', default: true })
  active: boolean;

  // Block-level CSS
  @Column({ type: 'json', nullable: true })
  css: Record<string, string>;

  columns: PageBlockColumn[];

  @OneToMany(type => PageBlockTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<PageBlock>>;
}

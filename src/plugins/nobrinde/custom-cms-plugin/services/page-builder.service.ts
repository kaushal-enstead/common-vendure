import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  Asset,
  ListQueryBuilder,
  ListQueryOptions,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
  TranslatorService,
  assertFound,
  ChannelService,
} from '@vendure/core';
import { In } from 'typeorm';
import { CMS_PLUGIN_OPTIONS } from '../constants';
import { Page } from '../entities/page-builder/page.entity';
import { PageBlock, PageBlockEntityFilters } from '../entities/page-builder/page-block.entity';
import { PluginInitOptions } from '../types';
import {
  CreatePageInput,
  UpdatePageInput,
  AssignPageToChannelInput,
  RemovePageFromChannelInput,
} from '../gql/generated';
import { BannerService } from './banner.service';
import { FaqService } from './faq.service';
import { DocumentService } from './document.service';
import { NewsService } from './news.service';
import { AuthorService } from './author.service';

@Injectable()
export class PageBuilderService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private channelService: ChannelService,
    private translator: TranslatorService,
    private bannerService: BannerService,
    private faqService: FaqService,
    private documentService: DocumentService,
    private newsService: NewsService,
    private authorService: AuthorService,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  findByIds(ctx: RequestContext, pageIds: ID[], relations?: RelationPaths<Page>): Promise<Array<Page>> {
    return this.connection.getRepository(ctx, Page).find({ where: { id: In(pageIds) }, relations });
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Page>,
    relations?: RelationPaths<Page>,
  ): Promise<PaginatedList<Page>> {
    return this.listQueryBuilder
      .build(Page, options, {
        relations,
        ctx,
        channelId: ctx.channelId,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  findOne(ctx: RequestContext, id: ID, relations?: RelationPaths<Page>): Promise<Page | null> {
    return this.connection.getRepository(ctx, Page).findOne({
      where: { id },
      relations,
    });
  }

  /**
   * Shop API: active pages on the current channel only.
   */
  async findAllForShop(
    ctx: RequestContext,
    options?: ListQueryOptions<Page>,
    relations?: RelationPaths<Page>,
  ): Promise<PaginatedList<Page>> {
    const merged: ListQueryOptions<Page> = {
      ...options,
      filter: {
        ...(options?.filter ?? {}),
        active: { eq: true },
      },
    };
    const pages = await this.findAll(ctx, merged, relations);
    pages.items = pages.items.map(page => {
      page.blocks = page.blocks.map(block => this.translator.translate(block, ctx));
      return page;
    });
    await Promise.all(pages.items.map(p => this.enrichPageBlocks(ctx, p)));
    return pages;
  }

  /**
   * Shop API: single active page on the current channel by id or slug.
   * Inactive blocks are omitted; blocks are ordered by index and translated for the request context.
   */
  async findOneForShop(
    ctx: RequestContext,
    identifier: { id?: ID | null; slug?: string | null },
    relations?: RelationPaths<Page>,
  ): Promise<Page | null> {
    const filter: Record<string, { eq: string | boolean }> = { active: { eq: true } };
    if (identifier.id) {
      filter.id = { eq: String(identifier.id) };
    } else if (identifier.slug != null && identifier.slug !== '') {
      filter.slug = { eq: identifier.slug };
    } else {
      return null;
    }

    const [items] = await this.listQueryBuilder
      .build(Page, { filter, take: 1 } as ListQueryOptions<Page>, {
        relations,
        ctx,
        channelId: ctx.channelId,
      })
      .getManyAndCount();

    const page = items[0] ?? null;
    if (!page?.blocks?.length) {
      return page;
    }

    page.blocks = [...page.blocks]
      .filter((b: PageBlock) => b.active)
      .sort((a, b) => a.index - b.index)
      .map(b => this.translator.translate(b, ctx));

    await this.enrichPageBlocks(ctx, page);

    return page;
  }

  async create(ctx: RequestContext, input: CreatePageInput): Promise<Page> {
    const pageRepo = this.connection.getRepository(ctx, Page);
    const newEntity = pageRepo.create({
      title: input.title || '',
      slug: input.slug || null,
      active: input.active ?? true,
      seo: input.seo || null,
    });
    await pageRepo.save(newEntity);

    await this.channelService.assignToChannels(ctx, Page, newEntity.id, [ctx.channelId]);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdatePageInput): Promise<Page> {
    const pageRepo = this.connection.getRepository(ctx, Page);
    const existingEntity = await this.connection.getEntityOrThrow(ctx, Page, input.id);

    if (input.title) existingEntity.title = input.title;
    if (input.slug) existingEntity.slug = input.slug;
    if (input.active !== undefined) existingEntity.active = input.active ?? false;
    if (input.seo) existingEntity.seo = input.seo;

    await pageRepo.save(existingEntity);

    return assertFound(this.findOne(ctx, existingEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, Page, id);
    try {
      await this.connection.getRepository(ctx, Page).remove(entity);
      return {
        result: DeletionResult.DELETED,
      };
    } catch (e: any) {
      return {
        result: DeletionResult.NOT_DELETED,
        message: e.toString(),
      };
    }
  }

  async assignPageToChannel(ctx: RequestContext, input: AssignPageToChannelInput): Promise<Array<Page>> {
    const pages = await this.connection.getRepository(ctx, Page).find({
      where: { id: In(input.pageIds) },
    });
    for (const item of pages) {
      this.channelService.assignToChannels(ctx, Page, item.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      pages.map(p => p.id),
    );
  }

  async removePageFromChannel(ctx: RequestContext, input: RemovePageFromChannelInput): Promise<Array<Page>> {
    const pages = await this.connection.getRepository(ctx, Page).find({
      where: { id: In(input.pageIds) },
    });
    for (const item of pages) {
      this.channelService.removeFromChannels(ctx, Page, item.id, [input.channelId]);
    }
    return this.findByIds(
      ctx,
      pages.map(p => p.id),
    );
  }

  private async enrichPageBlocks(ctx: RequestContext, page: Page): Promise<void> {
    if (!page.blocks?.length) return;

    const bannerIds = new Set<string>();
    const documentIds = new Set<string>();
    const faqIds = new Set<string>();
    type FilterCol = { block: any; colIdx: number; filters: PageBlockEntityFilters };
    const newsCols: FilterCol[] = [];
    const authorCols: FilterCol[] = [];

    for (const block of page.blocks) {
      (block.columns ?? []).forEach((col: any, i: number) => {
        const d = col.data as any;
        if (!d) return;
        if (d.type === 'banner' && d.itemId) bannerIds.add(d.itemId);
        else if (d.type === 'document' && d.itemId) documentIds.add(d.itemId);
        else if (d.type === 'faq' && d.itemId) faqIds.add(d.itemId);
        else if (d.type === 'news') newsCols.push({ block, colIdx: i, filters: d.filters });
        else if (d.type === 'authors') authorCols.push({ block, colIdx: i, filters: d.filters });
      });
    }

    const [banners, documents, faqs] = await Promise.all([
      bannerIds.size ? this.bannerService.findByIds(ctx, [...bannerIds]) : Promise.resolve([]),
      documentIds.size ? this.documentService.findByIds(ctx, [...documentIds]) : Promise.resolve([]),
      faqIds.size ? this.faqService.findByIds(ctx, [...faqIds]) : Promise.resolve([]),
    ]);

    const newsResults = new Map<FilterCol, any[]>();
    const authorResults = new Map<FilterCol, any[]>();
    await Promise.all([
      ...newsCols.map(async col => {
        const items = await this.loadByFilters(ctx, 'news', col.filters);
        newsResults.set(col, items);
      }),
      ...authorCols.map(async col => {
        const items = await this.loadByFilters(ctx, 'authors', col.filters);
        authorResults.set(col, items);
      }),
    ]);

    const isDbRef = (s: string) => !!s && !s.startsWith('http') && !s.startsWith('/');
    const assetIds = new Set<string>();

    for (const b of banners)
      (b.items ?? []).forEach((item: any) => item.assetId && assetIds.add(item.assetId));
    for (const d of documents)
      (d.items ?? []).forEach((item: any) => item.assetId && assetIds.add(item.assetId));
    for (const items of newsResults.values())
      items.forEach((n: any) => n.src && isDbRef(n.src) && assetIds.add(n.src));
    for (const items of authorResults.values())
      items.forEach((a: any) => a.logo && isDbRef(a.logo) && assetIds.add(a.logo));
    for (const block of page.blocks)
      (block.columns ?? []).forEach((col: any) => {
        const d = col.data as any;
        if (d && (d.type === 'image' || d.type === 'video') && d.url && isDbRef(d.url))
          assetIds.add(d.url);
      });

    const rawAssets = assetIds.size
      ? await this.connection.getRepository(ctx, Asset).find({ where: { id: In([...assetIds]) } })
      : [];
    const assetMap = new Map(rawAssets.map(a => [a.id, a]));

    const bannerMap = new Map(banners.map(b => [b.id, b]));
    const documentMap = new Map(documents.map(d => [d.id, d]));
    const faqMap = new Map(faqs.map(f => [f.id, f]));

    for (const block of page.blocks) {
      block.columns = (block.columns ?? []).map((col: any) => {
        const d = { ...(col.data as any) };
        if (d.type === 'banner' && bannerMap.has(d.itemId)) {
          const b = bannerMap.get(d.itemId) as any;
          d.banner = {
            ...b,
            items: (b.items ?? []).map((item: any) => ({
              ...item,
              asset: assetMap.get(item.assetId) ?? null,
            })),
          };
        } else if (d.type === 'document' && documentMap.has(d.itemId)) {
          const doc = documentMap.get(d.itemId) as any;
          d.document = {
            ...doc,
            items: (doc.items ?? []).map((item: any) => ({
              ...item,
              asset: assetMap.get(item.assetId) ?? null,
            })),
          };
        } else if (d.type === 'faq' && faqMap.has(d.itemId)) {
          d.faq = faqMap.get(d.itemId);
        } else if (d.type === 'image' || d.type === 'video') {
          if (d.url) {
            d.asset = isDbRef(d.url)
              ? (assetMap.get(d.url) ?? null)
              : { id: null, source: d.url, preview: d.url };
          } else {
            d.asset = null;
          }
        }
        return { ...col, data: d };
      });
    }

    for (const [colRef, items] of newsResults) {
      const col = colRef.block.columns[colRef.colIdx] as any;
      col.data = {
        ...col.data,
        items: items.map((n: any) => ({
          ...n,
          asset: n.src && assetMap.has(n.src) ? assetMap.get(n.src) : null,
        })),
      };
    }
    for (const [colRef, items] of authorResults) {
      const col = colRef.block.columns[colRef.colIdx] as any;
      col.data = {
        ...col.data,
        items: items.map((a: any) => ({
          ...a,
          asset: a.logo && assetMap.has(a.logo) ? assetMap.get(a.logo) : null,
        })),
      };
    }
  }

  private async loadByFilters(
    ctx: RequestContext,
    type: 'news' | 'authors',
    filters: PageBlockEntityFilters,
  ): Promise<any[]> {
    const filter: Record<string, any> = { active: { eq: true } };
    for (const c of filters?.conditions ?? []) {
      filter[c.field] = { [c.operator]: c.value };
    }
    const opts = { filter, take: 50 } as any;
    if (type === 'news') return (await this.newsService.findAll(ctx, opts)).items;
    return (await this.authorService.findAll(ctx, opts)).items;
  }
}

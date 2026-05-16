import { Args, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Permission } from '@vendure/common/lib/generated-types';
import {
  Allow,
  Ctx,
  ID,
  ListQueryOptions,
  PaginatedList,
  RelationPaths,
  Relations,
  RequestContext,
  Translated,
  UserInputError,
} from '@vendure/core';
import { Page } from '../../entities/page-builder/page.entity';
import { Header } from '../../entities/header/header.entity';
import { Footer } from '../../entities/footer/footer.entity';
import { News } from '../../entities/news/news.entity';
import { Author } from '../../entities/author/author.entity';
import { Faq } from '../../entities/faq/faq.entity';
import { Document } from '../../entities/document/document.entity';
import { Banner } from '../../entities/banner/banner.entity';
import { PageBuilderService } from '../../services/page-builder.service';
import { HeaderService } from '../../services/header.service';
import { FooterService } from '../../services/footer.service';
import { NewsService } from '../../services/news.service';
import { AuthorService } from '../../services/author.service';
import { FaqService } from '../../services/faq.service';
import { DocumentService } from '../../services/document.service';
import { BannerService } from '../../services/banner.service';

@Resolver()
export class CmsShopResolver {
  constructor(
    private pageBuilderService: PageBuilderService,
    private headerService: HeaderService,
    private footerService: FooterService,
    private newsService: NewsService,
    private authorService: AuthorService,
    private faqService: FaqService,
    private documentService: DocumentService,
    private bannerService: BannerService,
  ) {}

  // @Query()
  // @Allow(Permission.Public)
  // getPages(
  //   @Ctx() ctx: RequestContext,
  //   @Args() args: { options?: ListQueryOptions<Page> },
  //   @Relations(Page) relations: RelationPaths<Page>,
  // ): Promise<PaginatedList<Page>> {
  //   return this.pageBuilderService.findAllForShop(ctx, args.options ?? undefined, relations);
  // }

  @Query()
  @Allow(Permission.Public)
  async getPage(
    @Ctx() ctx: RequestContext,
    @Args() args: { id?: ID | null; slug?: string | null },
    @Relations(Page) relations: RelationPaths<Page>,
  ): Promise<Page | null> {
    const hasId = args.id != null && args.id !== '';
    const hasSlug = args.slug != null && args.slug !== '';
    if (hasId === hasSlug) {
      throw new UserInputError('Provide exactly one of `id` or `slug`.');
    }
    return this.pageBuilderService.findOneForShop(
      ctx,
      { id: hasId ? args.id! : null, slug: hasSlug ? args.slug! : null },
      relations,
    );
  }

  @Query()
  @Allow(Permission.Public)
  getHeader(
    @Ctx() ctx: RequestContext,
    @Args() args: { id?: ID | null; code?: string | null },
    @Relations(Header) relations: RelationPaths<Header>,
  ): Promise<Translated<Header> | null> {
    return this.headerService.findOneInCurrentChannel(ctx, args.id ?? null, args.code ?? null, relations);
  }

  @Query()
  @Allow(Permission.Public)
  getFooter(
    @Ctx() ctx: RequestContext,
    @Args() args: { id?: ID | null; code?: string | null },
    @Relations(Footer) relations: RelationPaths<Footer>,
  ): Promise<Translated<Footer> | null> {
    return this.footerService.findOneInCurrentChannel(ctx, args.id ?? null, args.code ?? null, relations);
  }

  @Query()
  @Allow(Permission.Public)
  getNews(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<News> },
    @Relations(News) relations: RelationPaths<News>,
  ): Promise<PaginatedList<Translated<News>>> {
    return this.newsService.findAll(ctx, args.options ?? undefined, relations);
  }

  @Query()
  @Allow(Permission.Public)
  getAuthors(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<Author> },
    @Relations(Author) relations: RelationPaths<Author>,
  ): Promise<PaginatedList<Translated<Author>>> {
    const options: ListQueryOptions<Author> = {
      ...args.options,
      filter: {
        ...(args.options?.filter ?? {}),
        active: { eq: true },
      },
    };
    return this.authorService.findAll(ctx, options, relations);
  }

  @Query()
  @Allow(Permission.Public)
  getFaq(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<Faq> },
    @Relations(Faq) relations: RelationPaths<Faq>,
  ): Promise<PaginatedList<Translated<Faq>>> {
    const options: ListQueryOptions<Faq> = {
      ...args.options,
      filter: {
        ...(args.options?.filter ?? {}),
        active: { eq: true },
      },
    };
    return this.faqService.findAll(ctx, options, relations);
  }

  @Query()
  @Allow(Permission.Public)
  getDocuments(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<Document> },
    @Relations(Document) relations: RelationPaths<Document>,
  ): Promise<PaginatedList<Translated<Document>>> {
    const options: ListQueryOptions<Document> = {
      ...args.options,
      filter: {
        ...(args.options?.filter ?? {}),
        active: { eq: true },
      },
    };
    return this.documentService.findAll(ctx, options, relations);
  }

  @Query()
  @Allow(Permission.Public)
  async getDocument(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Document) relations: RelationPaths<Document>,
  ): Promise<Translated<Document> | null> {
    const document = await this.documentService.findOne(ctx, args.id, relations);
    if (!document?.active) {
      return null;
    }
    return document;
  }

  @Query()
  @Allow(Permission.Public)
  getBanners(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: ListQueryOptions<Banner> },
    @Relations(Banner) relations: RelationPaths<Banner>,
  ): Promise<PaginatedList<Translated<Banner>>> {
    const options: ListQueryOptions<Banner> = {
      ...args.options,
      filter: {
        ...(args.options?.filter ?? {}),
        active: { eq: true },
      },
    };
    return this.bannerService.findAll(ctx, options, relations);
  }

  @Query()
  @Allow(Permission.Public)
  async getBanner(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(Banner) relations: RelationPaths<Banner>,
  ): Promise<Translated<Banner> | null> {
    const banner = await this.bannerService.findOne(ctx, args.id, relations);
    if (!banner?.active) {
      return null;
    }
    return banner;
  }
}

@Resolver('News')
export class CmsShopNewsEntityResolver {
  constructor(private newsService: NewsService) {}

  @ResolveField()
  async relatedNews(@Ctx() ctx: RequestContext, @Parent() news: News): Promise<Array<Translated<News>>> {
    if (!news.relatedNewsIds || news.relatedNewsIds.length === 0) {
      return [];
    }
    return this.newsService.findByIds(ctx, news.relatedNewsIds);
  }
}

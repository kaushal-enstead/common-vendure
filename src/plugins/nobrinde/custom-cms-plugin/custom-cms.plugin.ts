import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import {
  CMS_PLUGIN_OPTIONS,
  FaqPermissions,
  DocumentPermissions,
  BannerPermissions,
  AlertPermissions,
  FooterPermissions,
  HeaderPermissions,
  AuthorPermissions,
  CategoryPermissions,
  NewsPermissions,
  PagePermissions,
} from './constants';
import { PluginInitOptions } from './types';

// Entities
import { Faq } from './entities/faq/faq.entity';
import { FaqTranslation } from './entities/faq/faq-translation.entity';
import { FaqService } from './services/faq.service';
import { FaqAdminResolver } from './api/faq/faq-admin.resolver';

// Document entities
import { Document } from './entities/document/document.entity';
import { DocumentTranslation } from './entities/document/document-translation.entity';
import { DocumentService } from './services/document.service';
import { DocumentAdminResolver } from './api/document/document-admin.resolver';

// Banner entities
import { Banner } from './entities/banner/banner.entity';
import { BannerTranslation } from './entities/banner/banner-translation.entity';
import { BannerService } from './services/banner.service';
import { BannerAdminResolver } from './api/banner/banner-admin.resolver';

// Alert entities
import { Alert } from './entities/alert/alert.entity';
import { AlertTranslation } from './entities/alert/alert-translation.entity';
import { AlertService } from './services/alert.service';
import { AlertAdminResolver } from './api/alert/alert-admin.resolver';

// Footer entities
import { Footer } from './entities/footer/footer.entity';
import { FooterTranslation } from './entities/footer/footer-translation.entity';
import { FooterService } from './services/footer.service';
import { FooterAdminResolver } from './api/footer/footer-admin.resolver';

// Header entities
import { Header } from './entities/header/header.entity';
import { HeaderTranslation } from './entities/header/header-translation.entity';
import { HeaderService } from './services/header.service';
import { HeaderAdminResolver } from './api/header/header-admin.resolver';

// Author entities
import { Author } from './entities/author/author.entity';
import { AuthorTranslation } from './entities/author/author-translation.entity';
import { AuthorService } from './services/author.service';
import { AuthorAdminResolver } from './api/author/author-admin.resolver';

// Category entities
import { Category } from './entities/category/category.entity';
import { CategoryService } from './services/category.service';
import { CategoryAdminResolver } from './api/category/category-admin.resolver';

// News entities
import { News } from './entities/news/news.entity';
import { NewsTranslation } from './entities/news/news-translation.entity';
import { NewsService } from './services/news.service';
import { NewsAdminResolver, NewsAdminEntityResolver } from './api/news/news-admin.resolver';

// Page Builder entities
import { Page } from './entities/page-builder/page.entity';
import { PageBlock } from './entities/page-builder/page-block.entity';
import { PageBlockTranslation } from './entities/page-builder/page-block-translation.entity';
import { PageBuilderService } from './services/page-builder.service';
import { PageBlockService } from './services/page-block.service';
import { PageAdminResolver } from './api/page-builder/page-admin.resolver';
import { PageBlockAdminResolver } from './api/page-builder/page-block-admin.resolver';
import { ColumnDataUnionResolver } from './api/page-builder/column-data-union.resolver';

import { adminApiExtensions } from './api/admin-api';
import { cmsShopApiExtensions } from './api/shop/cms-shop-api-extensions';
import { CmsShopResolver, CmsShopNewsEntityResolver } from './api/shop/cms-shop.resolver';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: CMS_PLUGIN_OPTIONS, useFactory: () => CmsPlugin.options },
    FaqService,
    DocumentService,
    BannerService,
    AlertService,
    FooterService,
    HeaderService,
    AuthorService,
    CategoryService,
    NewsService,
    PageBuilderService,
    PageBlockService,
  ],
  configuration: config => {
    config.authOptions.customPermissions.push(
      FaqPermissions,
      DocumentPermissions,
      BannerPermissions,
      AlertPermissions,
      FooterPermissions,
      HeaderPermissions,
      AuthorPermissions,
      CategoryPermissions,
      NewsPermissions,
      PagePermissions,
    );
    return config;
  },
  compatibility: '^3.0.0',
  entities: [
    Faq,
    FaqTranslation,
    Document,
    DocumentTranslation,
    Banner,
    BannerTranslation,
    Alert,
    AlertTranslation,
    Footer,
    FooterTranslation,
    Header,
    HeaderTranslation,
    Author,
    AuthorTranslation,
    Category,
    News,
    NewsTranslation,
    Page,
    PageBlock,
    PageBlockTranslation,
  ],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [
      FaqAdminResolver,
      DocumentAdminResolver,
      BannerAdminResolver,
      AlertAdminResolver,
      FooterAdminResolver,
      HeaderAdminResolver,
      AuthorAdminResolver,
      CategoryAdminResolver,
      NewsAdminResolver,
      NewsAdminEntityResolver,
      PageAdminResolver,
      PageBlockAdminResolver,
    ],
  },
  shopApiExtensions: {
    schema: cmsShopApiExtensions,
    resolvers: [CmsShopResolver, CmsShopNewsEntityResolver, ColumnDataUnionResolver],
  },
  dashboard: './dashboard/index.tsx',
})
export class CmsPlugin {
  static options: PluginInitOptions;
  static init(options: PluginInitOptions): Type<CmsPlugin> {
    this.options = options;
    return CmsPlugin;
  }
}

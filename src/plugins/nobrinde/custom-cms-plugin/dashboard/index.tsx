import { defineDashboardExtension } from '@vendure/dashboard';
import { DollarSign } from 'lucide-react';
import { faqList } from './routes/faq/faqs';
import { faqDetail } from './routes/faq/faq_.$id';
import { documentList } from './routes/document/documents';
import { documentDetail } from './routes/document/document_.$id';
import { bannerList } from './routes/banner/banners';
import { bannerDetail } from './routes/banner/banner_.$id';
import { alertList } from './routes/alert/alerts';
import { alertDetail } from './routes/alert/alert_.$id';
import { footerList } from './routes/footer/footers';
import { footerDetail } from './routes/footer/footer_.$id';
import { headerList } from './routes/header/headers';
import { headerDetail } from './routes/header/header_.$id';
import { authorList } from './routes/author/authors';
import { authorDetail } from './routes/author/author_.$id';
import { categoryList } from './routes/category/categories';
import { categoryDetail } from './routes/category/category_.$id';
import { newsList } from './routes/news/news';
import { newsDetail } from './routes/news/news_.$id';
import { pageList } from './routes/page-builder/pages';
import { pageDetail } from './routes/page-builder/page_.$id';

export default defineDashboardExtension({
  routes: [
    faqList,
    faqDetail,
    documentList,
    documentDetail,
    bannerList,
    bannerDetail,
    alertList,
    alertDetail,
    footerList,
    footerDetail,
    headerList,
    headerDetail,
    authorList,
    authorDetail,
    categoryList,
    categoryDetail,
    newsList,
    newsDetail,
    pageList,
    pageDetail,
  ],
  navSections: [
    {
      id: 'cms',
      title: 'CMS',
      icon: DollarSign,
      // order: 100,
    },
  ],
  pageBlocks: [],
  actionBarItems: [],
  alerts: [],
  widgets: [],
  customFormComponents: {},
  dataTables: [],
  detailForms: [],
  login: {},
});

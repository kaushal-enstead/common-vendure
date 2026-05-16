import { faqAdminApiExtensions } from './faq/api-extensions';
import { documentAdminApiExtensions } from './document/api-extensions';
import { bannerAdminApiExtensions } from './banner/api-extensions';
import { alertAdminApiExtensions } from './alert/api-extensions';
import { footerAdminApiExtensions } from './footer/api-extensions';
import { headerAdminApiExtensions } from './header/api-extensions';
import { authorAdminApiExtensions } from './author/api-extensions';
import { categoryAdminApiExtensions } from './category/api-extensions';
import { newsAdminApiExtensions } from './news/api-extensions';
import { pageBuilderAdminApiExtensions } from './page-builder/api-extensions';
import { gql } from 'graphql-tag';

export const adminApiExtensions = gql`
  ${faqAdminApiExtensions}
  ${documentAdminApiExtensions}
  ${bannerAdminApiExtensions}
  ${alertAdminApiExtensions}
  ${footerAdminApiExtensions}
  ${headerAdminApiExtensions}
  ${authorAdminApiExtensions}
  ${categoryAdminApiExtensions}
  ${newsAdminApiExtensions}
  ${pageBuilderAdminApiExtensions}
`;

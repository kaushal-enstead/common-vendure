import { defineDashboardExtension } from '@vendure/dashboard';
import {
  CollectionDetailExternalTypeBlock,
  ProductDetailExternalTypeBlock,
  ProductDetailGroupedParentBlock,
  ProductExternalTypeListCell,
} from './components/product-catalog-meta';
import { MeasurementsEditor } from './components/measurements-editor';
import { PrintingsEditor } from './components/printings-editor';
import { SeoMetadataEditor } from './components/seo-metadata-editor';
import { LlmMetadataEditor } from './components/llm-metadata-editor';
import { PackagingEditor } from './components/packaging-editor';
import { DigitalAssetsEditor } from './components/digital-assets-editor';
import { NobrindeChannelIdSelect } from './components/nobrinde-channel-id-select';
import { PageContentEditor } from './components/page-content-editor';
import { CollectionSeoEditor } from './components/collection-seo-editor';
import { SemanticKnowledgeEditor } from './components/semantic-knowledge-editor';
import { RichContentEditor } from './components/rich-content-editor';
import { FaqsEditor } from './components/faqs-editor';
import { ProductDetailSyncButton } from './components/product-detail-sync-button';
import { ProductVariantDetailSyncButton } from './components/product-variant-detail-sync-button';
import { CollectionDetailSyncButton } from './components/collection-detail-sync-button';
import { FacetDetailSyncButton } from './components/facet-detail-sync-button';
import { CustomerDetailSyncButton } from './components/customer-detail-sync-button';
import { syncControlList } from './routes/sync-control/sync-control';
import { syncControlDetail } from './routes/sync-control/sync-control_$id';
import { ExternalProductTypeBadge } from './components/product-catalog-meta';

export default defineDashboardExtension({
  routes: [syncControlList, syncControlDetail],
  navSections: [],
  pageBlocks: [
    {
      id: 'nobrinde-product-external-type',
      location: {
        pageId: 'product-detail',
        column: 'side',
        position: { blockId: 'enabled-toggle', order: 'after' },
      },
      component: ProductDetailExternalTypeBlock,
      shouldRender: ctx => Boolean(ctx.entity?.id),
    },
    {
      id: 'nobrinde-product-grouped-parent',
      location: {
        pageId: 'product-detail',
        column: 'side',
        position: { blockId: 'nobrinde-product-external-type', order: 'after' },
      },
      component: ProductDetailGroupedParentBlock,
      shouldRender: ctx => {
        const cf = ctx.entity?.customFields;
        return Boolean(ctx.entity?.id && cf?.main_sku && cf?.external_product_type !== 'grouped');
      },
    },
    {
      id: 'nobrinde-collection-grouped-parent',
      location: {
        pageId: 'collection-detail',
        column: 'side',
        position: { blockId: 'privacy', order: 'after' },
      },
      component: CollectionDetailExternalTypeBlock,
      shouldRender: ctx => {
        const cf = ctx.entity?.parent;
        return Boolean(ctx.entity?.id && cf);
      },
    },
  ],
  actionBarItems: [
    {
      pageId: 'product-detail',
      component: ({ context }) => <ProductDetailSyncButton context={context} />,
    },
    {
      pageId: 'product-variant-detail',
      component: ({ context }) => <ProductVariantDetailSyncButton context={context} />,
    },
    {
      pageId: 'collection-detail',
      component: ({ context }) => <CollectionDetailSyncButton context={context} />,
    },
    {
      pageId: 'facet-detail',
      component: ({ context }) => <FacetDetailSyncButton context={context} />,
    },
    {
      pageId: 'customer-detail',
      component: ({ context }) => <CustomerDetailSyncButton context={context} />,
    },
  ],
  alerts: [],
  widgets: [],
  customFormComponents: {
    customFields: [
      {
        id: 'measurements-editor',
        component: MeasurementsEditor,
      },
      {
        id: 'printings-editor',
        component: PrintingsEditor,
      },
      {
        id: 'seo-metadata-editor',
        component: SeoMetadataEditor,
      },
      {
        id: 'llm-metadata-editor',
        component: LlmMetadataEditor,
      },
      {
        id: 'packaging-editor',
        component: PackagingEditor,
      },
      {
        id: 'digital-assets-editor',
        component: DigitalAssetsEditor,
      },
      {
        id: 'nobrinde-channel-id-select',
        component: NobrindeChannelIdSelect,
      },
      {
        id: 'page-content-editor',
        component: PageContentEditor,
      },
      {
        id: 'collection-seo-editor',
        component: CollectionSeoEditor,
      },
      {
        id: 'semantic-knowledge-editor',
        component: SemanticKnowledgeEditor,
      },
      {
        id: 'rich-content-editor',
        component: RichContentEditor,
      },
      {
        id: 'faqs-editor',
        component: FaqsEditor,
      },
    ],
  },
  dataTables: [
    {
      pageId: 'product-list',
      extendListDocument: `
        query ProductList($options: ProductListOptions) {
          products(options: $options) {
            items {
              customFields {
                type: external_product_type
              }
            }
            totalItems
          }
        }
      `,
      displayComponents: [
        {
          column: 'external_product_type',
          component: ProductExternalTypeListCell,
        },
        // {
        //   column: 'external_product_type',
        //   // The component will be passed the cell's `value`,
        //   // as well as all the other objects in the Tanstack Table
        //   // `CellContext` object.
        //   component: ({ value, cell, row, table }) => {
        //     return <ExternalProductTypeBadge type={value} />;
        //   },
        // },
      ],
    },
  ],
  detailForms: [],
  login: {},
});

import { defineDashboardExtension } from '@vendure/dashboard';
import { ZoneRatesEditor } from './components/zone-rates-editor';
import { ShippingQuoteBlock } from './components/shipping-quote-block';

export default defineDashboardExtension({
  routes: [],
  navSections: [],
  pageBlocks: [
    {
      id: 'custom-shipping-quote',
      location: {
        pageId: 'order-detail',
        column: 'side',
        position: {
          blockId: 'customer',
          order: 'before',
        },
      },
      component: ShippingQuoteBlock,
      shouldRender: ctx => Boolean(ctx.entity?.shippingAddress?.countryCode),
    },
    {
      id: 'custom-shipping-quote',
      location: {
        pageId: 'draft-order-detail',
        column: 'side',
        position: {
          blockId: 'draft-order-status',
          order: 'after',
        },
      },
      component: ShippingQuoteBlock,
      shouldRender: ctx => Boolean(ctx.entity?.shippingAddress?.countryCode),
    },
  ],
  actionBarItems: [],
  alerts: [],
  widgets: [],
  customFormComponents: {
    customFields: [
      {
        id: 'custom-shipping-zone-rates-editor',
        component: ZoneRatesEditor,
      },
    ],
  },
  dataTables: [],
  detailForms: [],
  login: {},
});

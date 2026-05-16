import { defineDashboardExtension } from '@vendure/dashboard';
import { QuantityPriceTiersEditor } from './components/quantity-price-tiers-editor';

export default defineDashboardExtension({
  routes: [],
  navSections: [],
  pageBlocks: [],
  actionBarItems: [],
  alerts: [],
  widgets: [],
  customFormComponents: {
    customFields: [
      {
        id: 'quantity-price-tiers-editor',
        component: QuantityPriceTiersEditor,
      },
    ],
  },
  dataTables: [],
  detailForms: [],
  login: {},
});

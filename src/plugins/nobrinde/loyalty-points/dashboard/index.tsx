import { defineDashboardExtension } from '@vendure/dashboard';
import { Medal } from 'lucide-react';
import { loyaltyPointsSettings } from './routes/settings/settings';
import { loyaltyPointsAllocator } from './routes/allocator/allocator';

export default defineDashboardExtension({
  routes: [loyaltyPointsSettings, loyaltyPointsAllocator],
  navSections: [
    {
      id: 'loyalty-points',
      title: 'Loyalty points',
      icon: Medal,
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

import { defineDashboardExtension } from '@vendure/dashboard';
import { kitDetail } from './routes/kits_.$id';
import { kitsList } from './routes/kits';
import { DollarSign } from 'lucide-react';

export default defineDashboardExtension({
  routes: [kitsList, kitDetail],
  navSections: [
    {
      id: 'kits',
      title: 'Kits',
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

import { defineDashboardExtension } from '@vendure/dashboard';
import { budgetDetail } from './routes/budgets_$id';
import { budgetList } from './routes/budgets';
import { DollarSign } from 'lucide-react';

export default defineDashboardExtension({
  routes: [budgetList, budgetDetail],
  navSections: [
    {
      id: 'budget',
      title: 'Budget',
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

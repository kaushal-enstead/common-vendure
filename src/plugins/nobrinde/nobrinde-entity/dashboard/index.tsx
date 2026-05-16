import { defineDashboardExtension } from '@vendure/dashboard';
import { FileSpreadsheet } from 'lucide-react';
import { nobrindeBudgetDetail } from './routes/budgets/nobrinde-budgets_$id';
import { nobrindeBudgetsList } from './routes/budgets/nobrinde-budgets';
import { nobrindeChannelDetail } from './routes/channels/nobrinde-channels_$id';
import { nobrindeChannelsList } from './routes/channels/nobrinde-channels';
import { nobrindeOrderDetail } from './routes/orders/nobrinde-orders_$id';
import { nobrindeOrdersList } from './routes/orders/nobrinde-orders';
import { nobrindeSaleUserDetail } from './routes/sale-users/nobrinde-sale-users_$id';
import { nobrindeSaleUsersList } from './routes/sale-users/nobrinde-sale-users';

export default defineDashboardExtension({
  routes: [
    nobrindeBudgetsList,
    nobrindeBudgetDetail,
    nobrindeChannelsList,
    nobrindeChannelDetail,
    nobrindeOrdersList,
    nobrindeOrderDetail,
    nobrindeSaleUsersList,
    nobrindeSaleUserDetail,
  ],
  navSections: [
    {
      id: 'nobrinde',
      title: 'Nobrinde',
      icon: FileSpreadsheet,
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

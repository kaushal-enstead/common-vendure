import { defineDashboardExtension } from '@vendure/dashboard';
// import { t } from '@lingui/core/macro';
import { BellRing } from 'lucide-react';

import { preOrderDetailRoute } from './pages/pre-order-detail';
import { preOrderListRoute } from './pages/pre-order-list';

defineDashboardExtension({
    navSections: [
        {
            id: 'sales',
            title: `Sales`,
            icon: BellRing,
            order: 200,
        },
    ],
    routes: [preOrderListRoute, preOrderDetailRoute],
});

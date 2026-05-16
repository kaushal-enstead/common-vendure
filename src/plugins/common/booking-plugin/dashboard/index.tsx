import { defineDashboardExtension } from '@vendure/dashboard';
// import { t } from '@lingui/core/macro';
import { CalendarDays } from 'lucide-react';

import { bookingServiceDetailRoute } from './pages/booking-detail';
import { bookingServicesListRoute } from './pages/booking-list';
import { bookingOrderDetailRoute } from './pages/booking-order-detail';
import { bookingOrdersListRoute } from './pages/booking-order-list';

defineDashboardExtension({
    navSections: [
        {
            id: 'booking',
            title: `Booking`,
            icon: CalendarDays,
            order: 318,
        },
    ],
    routes: [
        bookingServicesListRoute,
        bookingServiceDetailRoute,
        bookingOrdersListRoute,
        bookingOrderDetailRoute,
    ],
});

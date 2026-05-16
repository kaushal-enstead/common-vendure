import { defineDashboardExtension } from '@vendure/dashboard';
// import { t } from '@lingui/core/macro';
import { Star } from 'lucide-react';

import { reviewDetailRoute } from './pages/review-detail';
import {
    bookingReviewsListRoute,
    productReviewsListRoute,
    shopReviewsListRoute,
} from './pages/review-lists';

defineDashboardExtension({
    navSections: [
        {
            id: 'reviews',
            title: `Reviews`,
            icon: Star,
            order: 320,
        },
    ],
    routes: [
        productReviewsListRoute,
        shopReviewsListRoute,
        bookingReviewsListRoute,
        reviewDetailRoute,
    ],
});

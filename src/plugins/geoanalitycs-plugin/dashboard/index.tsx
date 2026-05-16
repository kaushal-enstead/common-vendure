import { defineDashboardExtension } from '@vendure/dashboard';
// import { t } from '@lingui/core/macro';
import { GeoAnalyticsDashboard } from './pages/geoanalytics-dashboard';
import { ChartBarStacked } from 'lucide-react';

defineDashboardExtension({
  routes: [
    {
      path: '/geoanalytics',
      loader: () => ({
        breadcrumb: `geoanalytics`,
      }),
      component: GeoAnalyticsDashboard,
      navMenuItem: {
        sectionId: 'analytics',
        id: `geoanalytics`,
        title: `GeoAnalytics`,
        url: '/geoanalytics',
      },
    },
  ],
  navSections: [
    {
      id: 'analytics',
      title: `Analytics`,
      icon: ChartBarStacked,
      order: 100,
    },
  ],
});

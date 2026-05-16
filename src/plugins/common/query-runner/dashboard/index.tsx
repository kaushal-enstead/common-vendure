import { defineDashboardExtension } from '@vendure/dashboard';
// import { t } from '@lingui/core/macro';
import { Database } from 'lucide-react';

import { queryRunner } from './routes/query-runner';

defineDashboardExtension({
  routes: [queryRunner],
  navSections: [
    {
      id: 'query-runner',
      title: `Query Runner`,
      icon: Database,
    },
  ],
});

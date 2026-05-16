import { DetailPageButton, ListPage, DashboardRouteDefinition } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { syncTableListDocument } from './sync-control.graphql';

const pageId = 'sync-control-list';

export const syncControlList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'settings',
    id: 'sync-control',
    url: '/settings/sync-control',
    title: 'Sync Control',
  },
  path: '/settings/sync-control',
  loader: () => ({
    breadcrumb: 'Sync Control',
  }),
  component: route => {
    return (
      <ListPage
        pageId={pageId}
        title={<Trans>Sync Control</Trans>}
        listQuery={syncTableListDocument}
        route={route}
        customizeColumns={{
          tableName: {
            cell: ({ row }) => {
              const id = row.original.id;
              const tableName = row.original.tableName;
              return <DetailPageButton id={id} label={tableName} />;
            },
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm ? { tableName: { contains: searchTerm } } : {};
        }}
        defaultSort={[{ id: 'tableName', desc: false }]}
        defaultVisibility={{
          id: false,
          createdAt: false,
          updatedAt: false,
        }}
      />
    );
  },
};

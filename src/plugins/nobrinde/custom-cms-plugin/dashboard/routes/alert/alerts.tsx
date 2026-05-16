import { Trans, useLingui } from '@lingui/react/macro';
import { PlusIcon } from 'lucide-react';
import {
  DashboardRouteDefinition,
  ListPage,
  DetailPageButton,
  ActionBarItem,
  PermissionGuard,
  Button,
  Link,
} from '@vendure/dashboard';
import {
  AssignAlertsToChannelBulkAction,
  DeleteAlertsBulkAction,
  RemoveAlertsFromChannelBulkAction,
} from './components/alert-bulk-actions.js';
import { alertListDocument } from './alert.graphql.js';
import { useRef } from 'react';

const pageId = 'alert-list';

export const alertList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'alert',
    url: '/cms/alerts',
    title: 'Alerts',
  },
  path: '/cms/alerts',
  loader: () => ({
    breadcrumb: 'Alerts',
  }),
  component: route => {
    const { t } = useLingui();
    const registerRefresher = useRef<() => void>(() => {});
    return (
      <ListPage
        pageId={pageId}
        registerRefresher={refreshFn => {
          registerRefresher.current = refreshFn;
        }}
        listQuery={alertListDocument}
        title={<Trans>Alerts</Trans>}
        customizeColumns={{
          code: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.code} />,
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                title: { contains: searchTerm },
                code: { contains: searchTerm },
              }
            : {};
        }}
        transformVariables={variables => {
          return {
            options: {
              ...variables.options,
              filterOperator: 'OR',
            },
          };
        }}
        defaultVisibility={{
          title: true,
          code: true,
          active: true,
        }}
        route={route}
        bulkActions={[
          {
            component: AssignAlertsToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveAlertsFromChannelBulkAction
                {...props}
                onSuccess={() => {
                  registerRefresher.current();
                }}
              />
            ),
            order: 200,
          },
          {
            component: props => (
              <DeleteAlertsBulkAction
                {...props}
                onSuccess={() => {
                  registerRefresher.current();
                }}
              />
            ),
            order: 300,
          },
        ]}
      >
        <ActionBarItem itemId="create-alert">
          <PermissionGuard requires={['CreateAlert']}>
            <Button render={<Link to="./new" />}>
              <PlusIcon className="mr-2 h-4 w-4" />
              <Trans>New Alert</Trans>
            </Button>
          </PermissionGuard>
        </ActionBarItem>
      </ListPage>
    );
  },
};

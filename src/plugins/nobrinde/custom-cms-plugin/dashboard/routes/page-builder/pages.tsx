import { Trans, useLingui } from '@lingui/react/macro';
import { PlusIcon } from 'lucide-react';
import {
  DashboardRouteDefinition,
  ListPage,
  DetailPageButton,
  ActionBarItem,
  Button,
  Link,
} from '@vendure/dashboard';
import { pageListDocument } from './page.graphql.js';
import { useRef } from 'react';
import {
  AssignPagesToChannelBulkAction,
  DeletePagesBulkAction,
  RemovePagesFromChannelBulkAction,
} from './components/page-bulk-actions.js';

const pageId = 'page-list';

export const pageList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'page-builder',
    url: '/cms/pages',
    title: 'Page Builder',
  },
  path: '/cms/pages',
  loader: () => ({
    breadcrumb: 'Page Builder',
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
        listQuery={pageListDocument}
        title={<Trans>Page Builder</Trans>}
        customizeColumns={{
          title: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.title} />,
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                title: { contains: searchTerm },
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
          slug: true,
          active: true,
        }}
        route={route}
        bulkActions={[
          {
            component: AssignPagesToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemovePagesFromChannelBulkAction
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
              <DeletePagesBulkAction
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
        <ActionBarItem itemId="create-page" requiresPermission={['CreatePage']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Page</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

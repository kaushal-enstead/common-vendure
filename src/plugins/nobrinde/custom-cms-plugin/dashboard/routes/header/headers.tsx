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
import { headerListDocument } from './header.graphql.js';
import { useRef } from 'react';

const pageId = 'header-list';

export const headerList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'header',
    url: '/cms/headers',
    title: 'Headers',
  },
  path: '/cms/headers',
  loader: () => ({
    breadcrumb: 'Headers',
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
        listQuery={headerListDocument}
        title={<Trans>Headers</Trans>}
        customizeColumns={{
          code: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.code} />,
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
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
          code: true,
        }}
        route={route}
      >
        <ActionBarItem itemId="create-header" requiresPermission={['CreateHeader']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Header</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

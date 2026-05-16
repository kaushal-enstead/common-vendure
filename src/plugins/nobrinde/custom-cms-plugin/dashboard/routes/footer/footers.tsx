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
import { footerListDocument } from './footer.graphql.js';
import { useRef } from 'react';

const pageId = 'footer-list';

export const footerList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'footer',
    url: '/cms/footers',
    title: 'Footers',
  },
  path: '/cms/footers',
  loader: () => ({
    breadcrumb: 'Footers',
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
        listQuery={footerListDocument}
        title={<Trans>Footers</Trans>}
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
        <ActionBarItem itemId="create-footer" requiresPermission={['CreateFooter']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Footer</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

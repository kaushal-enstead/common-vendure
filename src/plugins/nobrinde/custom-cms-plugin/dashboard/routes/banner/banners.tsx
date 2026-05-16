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
import {
  AssignBannersToChannelBulkAction,
  DeleteBannersBulkAction,
  RemoveBannersFromChannelBulkAction,
} from './components/banner-bulk-actions.js';
import { bannerListDocument } from './banner.graphql.js';
import { useRef } from 'react';

const pageId = 'banner-list';

export const bannerList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'banner',
    url: '/cms/banners',
    title: 'Banners',
  },
  path: '/cms/banners',
  loader: () => ({
    breadcrumb: 'Banners',
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
        listQuery={bannerListDocument}
        title={<Trans>Banners</Trans>}
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
            component: AssignBannersToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveBannersFromChannelBulkAction
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
              <DeleteBannersBulkAction
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
        <ActionBarItem itemId="create-banner" requiresPermission={['CreateBanner']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Banner</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

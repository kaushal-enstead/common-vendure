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
import { newsListDocument } from './news.graphql.js';
import { useRef } from 'react';
import {
  AssignNewsToChannelBulkAction,
  DeleteNewsBulkAction,
  RemoveNewsFromChannelBulkAction,
} from './components/news-bulk-actions.js';

const pageId = 'news-list';

export const newsList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'news',
    url: '/cms/news',
    title: 'News',
  },
  path: '/cms/news',
  loader: () => ({
    breadcrumb: 'News',
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
        listQuery={newsListDocument}
        title={<Trans>News</Trans>}
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
        defaultVisibility={{
          title: true,
          author: true,
          category: true,
        }}
        route={route}
        bulkActions={[
          {
            component: AssignNewsToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveNewsFromChannelBulkAction
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
              <DeleteNewsBulkAction
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
        <ActionBarItem itemId="create-news" requiresPermission={['CreateNews']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New News</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

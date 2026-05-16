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
  AssignAuthorsToChannelBulkAction,
  DeleteAuthorsBulkAction,
  RemoveAuthorsFromChannelBulkAction,
} from './components/author-bulk-actions.js';
import { authorListDocument } from './author.graphql.js';
import { useRef } from 'react';

const pageId = 'author-list';

export const authorList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'author',
    url: '/cms/authors',
    title: 'Authors',
  },
  path: '/cms/authors',
  loader: () => ({
    breadcrumb: 'Authors',
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
        listQuery={authorListDocument}
        title={<Trans>Authors</Trans>}
        customizeColumns={{
          name: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.name} />,
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                name: { contains: searchTerm },
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
          name: true,
          title: true,
          active: true,
        }}
        route={route}
        bulkActions={[
          {
            component: AssignAuthorsToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveAuthorsFromChannelBulkAction
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
              <DeleteAuthorsBulkAction
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
        <ActionBarItem itemId="create-author" requiresPermission={['CreateAuthor']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Author</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

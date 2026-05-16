import { Trans, useLingui } from '@lingui/react/macro';
import { PlusIcon } from 'lucide-react';
import {
  DashboardRouteDefinition,
  ListPage,
  DetailPageButton,
  ActionBarItem,
  Button,
  DataTableCellComponent,
  Badge,
  Link,
} from '@vendure/dashboard';
import { categoryListDocument } from './category.graphql.js';
import { useRef } from 'react';
import {
  AssignCategoriesToChannelBulkAction,
  DeleteCategoriesBulkAction,
  RemoveCategoriesFromChannelBulkAction,
} from './components/category-bulk-actions.js';

const pageId = 'category-list';

export const CategoryTypeCell: DataTableCellComponent<{ type: string }> = ({ row }) => {
  const variantMap = {
    news: 'default',
    authors: 'success',
  };
  const value = row.original.type;
  return (
    <Badge variant={variantMap[value ?? 'news']}>
      <Trans>{value}</Trans>
    </Badge>
  );
};

export const categoryList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'category',
    url: '/cms/categories',
    title: 'Categories',
  },
  path: '/cms/categories',
  loader: () => ({
    breadcrumb: 'Categories',
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
        listQuery={categoryListDocument}
        title={<Trans>Categories</Trans>}
        customizeColumns={{
          name: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.name} />,
          },
          type: {
            cell: CategoryTypeCell,
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                name: { contains: searchTerm },
                description: { contains: searchTerm },
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
          type: true,
          active: true,
          description: true,
        }}
        facetedFilters={{
          type: {
            title: t`Type`,
            options: [
              { label: 'News', value: 'news' },
              { label: 'Authors', value: 'authors' },
            ],
          },
        }}
        route={route}
        bulkActions={[
          {
            component: AssignCategoriesToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveCategoriesFromChannelBulkAction
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
              <DeleteCategoriesBulkAction
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
        <ActionBarItem itemId="create-category" requiresPermission={['CreateCategory']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Category</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

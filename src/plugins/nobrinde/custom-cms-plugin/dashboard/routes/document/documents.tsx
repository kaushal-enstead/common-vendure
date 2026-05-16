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
  AssignDocumentsToChannelBulkAction,
  DeleteDocumentsBulkAction,
  RemoveDocumentsFromChannelBulkAction,
} from './components/document-bulk-actions.js';
import { documentListDocument } from './document.graphql.js';
import { useRef } from 'react';

const pageId = 'document-list';

export const documentList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'document',
    url: '/cms/documents',
    title: 'Documents',
  },
  path: '/cms/documents',
  loader: () => ({
    breadcrumb: 'Documents',
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
        listQuery={documentListDocument}
        title={<Trans>Documents</Trans>}
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
            component: AssignDocumentsToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveDocumentsFromChannelBulkAction
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
              <DeleteDocumentsBulkAction
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
        <ActionBarItem itemId="create-document" requiresPermission={['CreateDocument']}>
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Document</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

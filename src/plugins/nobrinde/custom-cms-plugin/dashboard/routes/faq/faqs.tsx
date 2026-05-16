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
  AssignFaqsToChannelBulkAction,
  DeleteFaqsBulkAction,
  RemoveFaqsFromChannelBulkAction,
} from './components/faq-bulk-actions.js';
import { faqListDocument } from './faq.graphql.js';
import { useRef } from 'react';

const pageId = 'faq-list';

export const faqList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'cms',
    id: 'faq',
    url: '/cms/faqs',
    title: 'FAQs',
  },
  path: '/cms/faqs',
  loader: () => ({
    breadcrumb: 'FAQs',
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
        listQuery={faqListDocument}
        title={<Trans>FAQs</Trans>}
        customizeColumns={{
          code: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.code} />,
          },
          // explanation: {
          //   cell: RichTextDescriptionCell,
          // },
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
            component: AssignFaqsToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveFaqsFromChannelBulkAction
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
              <DeleteFaqsBulkAction
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
        <ActionBarItem itemId="create-faq" requiresPermission={['CreateFaq']}>
          {/* <PermissionGuard requires={['UpdateCatalog']}>
          <Button variant="outline" onClick={handleRebuildSearchIndex}>
            <ListRestart />
            <Trans>Rebuild search index</Trans>
          </Button>
        </PermissionGuard> */}
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New FAQ</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

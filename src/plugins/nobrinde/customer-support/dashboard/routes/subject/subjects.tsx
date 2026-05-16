import {
  Button,
  DashboardRouteDefinition,
  ListPage,
  ActionBarItem,
  DetailPageButton,
  PermissionGuard,
  BooleanDisplayBadge,
  Link,
} from '@vendure/dashboard';
import { PlusIcon } from 'lucide-react';
import { getSupportSubjectList, deleteSupportSubjectDocument } from './subjects.graphql';
// import { DeleteSupportSubjectsBulkAction } from './components/delete-supports-bulk';
import { Trans } from '@lingui/react/macro';

const pageId = 'support-subject-list';

export const supportSubjectList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'support',
    id: 'support-subjects',
    url: '/support-subjects',
    title: 'Subjects',
  },
  path: '/support-subjects',
  loader: () => ({
    breadcrumb: 'Subjects',
  }),
  component: route => (
    <ListPage
      pageId={pageId}
      title="Subjects"
      onSearchTermChange={searchTerm => {
        return {
          code: {
            contains: searchTerm,
          },
          name: {
            contains: searchTerm,
          },
        };
      }}
      transformVariables={variables => {
        return {
          options: {
            ...variables.options,
            filterOperator: 'OR',
          },
        };
      }}
      listQuery={getSupportSubjectList}
      deleteMutation={deleteSupportSubjectDocument}
      route={route}
      customizeColumns={{
        code: {
          header: 'Code',
          cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.name} />,
        },
        isActive: {
          header: 'Active',
          cell: ({ row }) => <BooleanDisplayBadge value={row.original.isActive} />,
        },
      }}
      // additionalColumns={{
      //   combined: {
      //     header: 'Combined',
      //     cell: ({ row }) => {
      //       const subject = row.original as any;
      //       const value = `${subject.code} ${subject.name}`;
      //       return <DetailPageButton id={subject.id} label={value} />;
      //     },
      //   },
      // }}
      defaultColumnOrder={['code', 'name']}
      defaultVisibility={{
        id: false,
        createdAt: false,
        updatedAt: false,
        code: true,
        name: true,
        isActive: true,
        translations: false,
        description: false,
      }}
      // bulkActions={[
      //   {
      //     component: DeleteSupportSubjectsBulkAction,
      //     order: 500,
      //   },
      // ]}
    >
      <ActionBarItem itemId="create-support-subject" requiresPermission={['CreateSupportSubject']}>
        <Button render={<Link to="./new" />}>
          <PlusIcon className="mr-2 h-4 w-4" />
          <Trans>New Subject</Trans>
        </Button>
      </ActionBarItem>
    </ListPage>
  ),
};

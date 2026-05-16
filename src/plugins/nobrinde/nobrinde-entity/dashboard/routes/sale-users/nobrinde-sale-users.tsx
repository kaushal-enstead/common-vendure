import { DetailPageButton, ListPage, DashboardRouteDefinition } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { nobrindeSaleUserListDocument } from './nobrinde-sale-users.graphql';

const pageId = 'nobrinde-sale-user-list';

export const nobrindeSaleUsersList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'nobrinde',
    id: 'nobrinde-sale-users',
    url: '/nobrinde/sale-users',
    title: 'Sale users',
  },
  path: '/nobrinde/sale-users',
  loader: () => ({
    breadcrumb: 'Sale users',
  }),
  component: route => {
    return (
      <ListPage
        pageId={pageId}
        title={<Trans>Nobrinde Sale users</Trans>}
        listQuery={nobrindeSaleUserListDocument}
        route={route}
        customizeColumns={{
          id_vendedor: {
            cell: ({ row }) => {
              const value = row.original.id_vendedor;
              const id = row.original.id;
              return <DetailPageButton id={id} label={String(value)} />;
            },
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                _or: [
                  { nome: { contains: searchTerm } },
                  { sigla: { contains: searchTerm } },
                  { email: { contains: searchTerm } },
                ],
              }
            : {};
        }}
        defaultSort={[{ id: 'id_vendedor', desc: false }]}
        transformVariables={variables => ({
          options: {
            ...variables.options,
            filterOperator: 'OR',
          },
        })}
        defaultVisibility={{
          id: false,
          createdAt: false,
          updatedAt: false,
        }}
      />
    );
  },
};

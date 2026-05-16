import { DetailPageButton, ListPage, DashboardRouteDefinition } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { nobrindeOrderListDocument } from './nobrinde-orders.graphql';

const pageId = 'nobrinde-order-list';

export const nobrindeOrdersList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'nobrinde',
    id: 'nobrinde-orders',
    url: '/nobrinde/orders',
    title: 'Orders',
  },
  path: '/nobrinde/orders',
  loader: () => ({
    breadcrumb: 'Orders',
  }),
  component: route => {
    return (
      <ListPage
        pageId={pageId}
        title={<Trans>Nobrinde Orders</Trans>}
        listQuery={nobrindeOrderListDocument}
        route={route}
        customizeColumns={{
          id_phc: {
            cell: ({ row }) => {
              const value = row.original.id_phc;
              const id = row.original.id;
              return <DetailPageButton id={id} label={String(value)} />;
            },
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                empresa: { contains: searchTerm },
                ...(Number.isFinite(Number(searchTerm)) ? { id_phc: { eq: Number(searchTerm) } } : {}),
              }
            : {};
        }}
        defaultSort={[{ id: 'id_phc', desc: true }]}
        transformVariables={variables => {
          return {
            options: {
              ...variables.options,
              filterOperator: 'OR',
            },
          };
        }}
        defaultVisibility={{
          id: false,
          createdAt: false,
          updatedAt: false,
        }}
      />
    );
  },
};

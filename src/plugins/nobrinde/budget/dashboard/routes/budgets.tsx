import {
  DetailPageButton,
  CustomerCell,
  OrderMoneyCell,
  Button,
  ListPage,
  api,
  useServerConfig,
  ActionBarItem,
  BadgeProps,
} from '@vendure/dashboard';
import { ResultOf } from 'gql.tada';
import { Trans, useLingui } from '@lingui/react/macro';
import { PlusIcon } from 'lucide-react';
import { createBudgetOrderDocument, budgetListDocument } from './budgets.graphql';
import {
  Badge,
  DashboardRouteDefinition,
  DataTableCellComponent,
  useMutation,
  useNavigate,
} from '@vendure/dashboard';

const pageId = 'budget-list';

export const BudgetStateCell: DataTableCellComponent<{ state: string }> = ({ row }) => {
  const variantMap: Record<string, BadgeProps['variant']> = {
    Pending: 'outline',
    Accepted: 'success',
    Rejected: 'destructive',
    ChangesRequested: 'default',
  };
  const value = row.original.state;
  return (
    <Badge variant={variantMap[value ?? 'Pending'] ?? 'outline'}>
      <Trans>{value}</Trans>
    </Badge>
  );
};

export const BudgetTypeCell: DataTableCellComponent<{ type: string }> = ({ row }) => {
  const variantMap: Record<string, BadgeProps['variant']> = {
    Admin: 'secondary',
    Customer: 'success',
  };
  const value = row.original.type;
  return (
    <Badge variant={variantMap[value ?? 'Admin'] ?? 'outline'}>
      <Trans>{value}</Trans>
    </Badge>
  );
};

export const budgetList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'budget',
    id: 'budgets',
    url: '/budgets',
    title: 'Budgets',
  },
  path: '/budgets',
  loader: () => ({
    breadcrumb: 'Budgets',
  }),
  component: route => {
    const serverConfig = useServerConfig();
    const navigate = useNavigate();
    const { t } = useLingui();
    const { mutate: createBudgetOrder } = useMutation({
      mutationFn: api.mutate(createBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof createBudgetOrderDocument>) => {
        navigate({ to: '/budgets/$id', params: { id: result.createBudgetOrder.id } as any });
      },
    });
    return (
      <ListPage
        pageId={pageId}
        title={<Trans>Budgets</Trans>}
        onSearchTermChange={searchTerm => {
          return {
            _or: [
              {
                code: {
                  contains: searchTerm,
                },
              },
              {
                customerLastName: {
                  contains: searchTerm,
                },
              },
              // {
              //   transactionId: {
              //     contains: searchTerm,
              //   },
              // },
            ],
          };
        }}
        defaultSort={[{ id: 'orderPlacedAt', desc: true }]}
        listQuery={budgetListDocument}
        route={route}
        customizeColumns={{
          total: {
            meta: { dependencies: ['currencyCode'] },
            cell: OrderMoneyCell,
          },
          totalWithTax: {
            meta: { dependencies: ['currencyCode'] },
            cell: OrderMoneyCell,
          },
          state: {
            cell: BudgetStateCell,
          },
          code: {
            cell: ({ cell, row }) => {
              const value = cell.getValue() as string;
              const id = row.original.id;
              return <DetailPageButton id={id} label={value} />;
            },
          },
          type: {
            cell: BudgetTypeCell,
          },
          customer: {
            cell: CustomerCell,
          },
          // shippingLines: {
          //   header: () => <Trans>Shipping</Trans>,
          //   cell: ({ row }) => {
          //     const value = row.original.shippingLines;
          //     return <div>{value?.map(line => line.shippingMethod.name).join(', ')}</div>;
          //   },
          // },
        }}
        defaultVisibility={{
          id: false,
          createdAt: false,
          updatedAt: false,
          total: false,
          currencyCode: false,
        }}
        facetedFilters={{
          state: {
            title: t`State`,
            options: [
              { label: 'Pending', value: 'Pending' },
              { label: 'Accepted', value: 'Accepted' },
              { label: 'Rejected', value: 'Rejected' },
              { label: 'ChangesRequested', value: 'ChangesRequested' },
            ],
          },
          type: {
            title: t`Type`,
            options: [
              { label: 'Admin', value: 'Admin' },
              { label: 'Customer', value: 'Customer' },
            ],
          },
        }}
      >
        <ActionBarItem itemId="create-budget-order">
          <Button onClick={() => createBudgetOrder({})}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>Budget</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

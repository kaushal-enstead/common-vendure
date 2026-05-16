import { Trans, useLingui } from '@lingui/react/macro';
import { PlusIcon } from 'lucide-react';
import {
  DashboardRouteDefinition,
  ListPage,
  DetailPageButton,
  ActionBarItem,
  RichTextDescriptionCell,
  Button,
  DataTableCellComponent,
  Badge,
  BadgeProps,
  Money,
  Link,
} from '@vendure/dashboard';
import {
  AssignFacetValuesToKitsBulkAction,
  AssignKitsToChannelBulkAction,
  DeleteKitsBulkAction,
  RemoveKitsFromChannelBulkAction,
} from './components/kit-bulk-actions.js';
import { kitListDocument } from './kits.graphql.js';
import { useRef } from 'react';

const pageId = 'kit-list';

export const KitTypeCell: DataTableCellComponent<{ type: string }> = ({ row }) => {
  const variantMap: Record<string, BadgeProps['variant']> = {
    Admin: 'secondary',
    Customer: 'success',
  };
  const value = row.original.type;
  return <Badge variant={variantMap[value ?? 'Admin'] ?? 'outline'}>{value}</Badge>;
};

export const kitsList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'catalog',
    id: 'kits',
    url: '/kits',
    title: 'Kits',
  },
  path: '/kits',
  loader: () => ({
    breadcrumb: 'Kits',
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
        listQuery={kitListDocument}
        title={<Trans>Kits</Trans>}
        facetedFilters={{
          type: {
            title: t`Type`,
            options: [
              { label: 'Admin', value: 'Admin' },
              { label: 'Customer', value: 'Customer' },
            ],
          },
        }}
        customizeColumns={{
          name: {
            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.name} />,
          },
          description: {
            cell: RichTextDescriptionCell,
          },
          type: {
            cell: KitTypeCell,
          },
          variants: {
            header: t`Price`,
            cell: ({ row }) => {
              const variants = row.original.variants;
              let price = 0;
              let priceWithTax = 0;
              let currencyCode = '';
              let discountedPrice = 0;
              let discountedPriceWithTax = 0;
              for (const v of variants) {
                price += v.productVariant.price * v.quantity;
                priceWithTax += v.productVariant.priceWithTax * v.quantity;
                currencyCode = v.productVariant.currencyCode;
                discountedPrice += v.productVariant.price * v.quantity * (1 - (v.discount ?? 0) / 100);
                discountedPriceWithTax +=
                  v.productVariant.priceWithTax * v.quantity * (1 - (v.discount ?? 0) / 100);
              }
              return (
                <div className="flex flex-col gap-1">
                  <div className="text-xs">
                    <Money value={priceWithTax} currency={currencyCode} />
                  </div>
                  {discountedPriceWithTax > 0 && (
                    <div className="text-xs text-success">
                      <Money value={discountedPriceWithTax} currency={currencyCode} />
                    </div>
                  )}
                </div>
              );
            },
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                name: { contains: searchTerm },
                slug: { contains: searchTerm },
                sku: { contains: searchTerm },
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
          featuredAsset: true,
          slug: true,
          enabled: true,
        }}
        route={route}
        bulkActions={[
          {
            component: AssignKitsToChannelBulkAction,
            order: 100,
          },
          {
            component: props => (
              <RemoveKitsFromChannelBulkAction
                {...props}
                onSuccess={() => {
                  registerRefresher.current();
                }}
              />
            ),
            order: 200,
          },
          {
            component: AssignFacetValuesToKitsBulkAction,
            order: 300,
          },
          //   {
          //     component: DuplicateKitsBulkAction,
          //     order: 400,
          //   },
          {
            component: props => (
              <DeleteKitsBulkAction
                {...props}
                onSuccess={() => {
                  registerRefresher.current();
                }}
              />
            ),
            order: 400,
          },
        ]}
      >
        <ActionBarItem itemId="create-kit" requiresPermission={['CreateKit']}>
          {/* <PermissionGuard requires={['UpdateCatalog']}>
          <Button variant="outline" onClick={handleRebuildSearchIndex}>
            <ListRestart />
            <Trans>Rebuild search index</Trans>
          </Button>
        </PermissionGuard> */}
          <Button render={<Link to="./new" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Kit</Trans>
          </Button>
        </ActionBarItem>
      </ListPage>
    );
  },
};

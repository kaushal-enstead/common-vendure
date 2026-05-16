import {
    Badge,
    DashboardRouteDefinition,
    DetailPageButton,
    ListPage,
    VendureImage,
    useLocalFormat,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { ResultOf } from '@/gql';
import { AnyRoute } from '@tanstack/react-router';
import { BellRing } from 'lucide-react';

import { AcceptPreOrdersBulkAction } from '../bulk-actions';
import { getPreOrdersDocument } from '../documents';

type PreOrderRow = ResultOf<typeof getPreOrdersDocument>['preOrders']['items'][number];

function StatusBadge({ status }: { status: string }) {
    const variant =
        status === 'ACCEPTED' || status === 'COMPLETED' || status === 'CUSTOMER_ACCEPTED'
            ? 'default'
            : status === 'REFUSED'
              ? 'destructive'
              : 'secondary';
    return (
        <Badge variant={variant} className="capitalize">
            {status.toLowerCase().replaceAll('_', ' ')}
        </Badge>
    );
}

function ProductVariantCell({ row }: { row: { original: PreOrderRow } }) {
    const { formatCurrency } = useLocalFormat();
    const pv = row.original.productVariant;
    if (!pv) return <span>—</span>;

    const asset = pv.featuredAsset ?? pv.product?.featuredAsset ?? null;

    return (
        <div className="flex items-center gap-2">
            {asset ? (
                <VendureImage
                    asset={asset}
                    alt={pv.name}
                    preset="tiny"
                    className="size-9 rounded-md border object-cover"
                />
            ) : (
                <div className="size-9 rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    —
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {pv.product?.id && pv.id ? (
                    <DetailPageButton
                        href={`/catalog/products/${pv.product.id}/variants/${pv.id}`}
                        label={pv.name}
                        className="border"
                    />
                ) : (
                    <span>{pv.name || '—'}</span>
                )}
                <span className="text-xs text-muted-foreground">
                    {formatCurrency(pv.priceWithTax, pv.currencyCode)}
                </span>
            </div>
        </div>
    );
}

function CustomerCell({ row }: { row: { original: PreOrderRow } }) {
    const c = row.original.customer;
    if (!c?.id) return <span>—</span>;
    const label = [c.title, c.firstName, c.lastName].filter(Boolean).join(' ') || c.id;
    return <DetailPageButton href={`/customers/${c.id}`} label={label} className="border" />;
}

function PreOrderListPage({ route }: { route: AnyRoute }) {
    const { t } = useLingui();
    return (
        <ListPage
            pageId="pre-order-list"
            title={t`Pre-orders`}
            listQuery={getPreOrdersDocument}
            route={route}
            defaultSort={[{ id: 'createdAt', desc: true }]}
            onSearchTermChange={term => {
                const trimmed = term.trim();
                return trimmed ? { message: { contains: trimmed } } : ({} as any);
            }}
            defaultVisibility={{
                productVariant: true,
                quantity: true,
                customer: true,
                createdAt: true,
                status: true,
                message: true,
            }}
            defaultColumnOrder={['productVariant', 'quantity', 'customer', 'createdAt', 'status', 'message']}
            customizeColumns={{
                id: {
                    cell: ({ row }) => {
                        const r = row.original as PreOrderRow;
                        return (
                            <DetailPageButton
                                href={`/pre-orders/${r.id}`}
                                label={`${r.id.slice(0, 8)}…`}
                                className="border"
                            />
                        );
                    },
                },
                productVariant: {
                    meta: { dependencies: ['productVariant'] },
                    cell: ProductVariantCell as any,
                },
                customer: {
                    meta: { dependencies: ['customer'] },
                    cell: CustomerCell as any,
                },
                status: {
                    cell: ({ row }) => <StatusBadge status={(row.original as PreOrderRow).status} />,
                },
                message: {
                    cell: ({ row }) => (row.original as PreOrderRow).message || '—',
                },
            }}
            bulkActions={[{ component: AcceptPreOrdersBulkAction, order: 100 }]}
        />
    );
}

export const preOrderListRoute: DashboardRouteDefinition = {
    path: '/pre-orders',
    loader: () => ({ breadcrumb: 'Pre-orders' }),
    navMenuItem: {
        sectionId: 'sales',
        id: 'pre-orders',
        url: '/pre-orders',
        title: 'Pre-orders',
        icon: BellRing,
        requiresPermission: ['ReadPreOrder'],
    },
    component: (route: AnyRoute) => <PreOrderListPage route={route} />,
};

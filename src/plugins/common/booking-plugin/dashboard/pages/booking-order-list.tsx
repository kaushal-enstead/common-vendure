import {
    Badge,
    DashboardRouteDefinition,
    DetailPageButton,
    ListPage,
    VendureImage,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { ResultOf } from '@/gql';
import { AnyRoute } from '@tanstack/react-router';
import { FileStack } from 'lucide-react';

import { getBookingOrdersDocument } from '../documents';

type OrderRow = ResultOf<typeof getBookingOrdersDocument>['bookingOrders']['items'][number];

function statusVariant(
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'accepted':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'refused':
            return 'destructive';
        case 'change_proposed':
            return 'outline';
        default:
            return 'secondary';
    }
}

export const bookingOrdersListRoute: DashboardRouteDefinition = {
    path: '/booking/orders',
    loader: () => ({ breadcrumb: 'Booking orders' }),
    navMenuItem: {
        sectionId: 'booking',
        id: 'booking-orders',
        url: '/booking/orders',
        title: 'Orders',
        icon: FileStack,
        requiresPermission: ['ReadBooking'],
    },
    component: (route: AnyRoute) => <BookingOrdersListPage route={route} />,
};

function BookingOrdersListPage({ route }: { route: AnyRoute }) {
    const { t } = useLingui();
    return (
        <ListPage
            pageId="booking-orders-list"
            title={t`Booking orders`}
            listQuery={getBookingOrdersDocument}
            route={route}
            defaultSort={[{ id: 'status', desc: false }]}
            onSearchTermChange={() => ({})}
            defaultVisibility={{
                id: true,
                customer: true,
                booking: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            }}
            defaultColumnOrder={['id', 'customer', 'booking', 'status', 'createdAt', 'updatedAt']}
            customizeColumns={{
                id: {
                    cell: ({ row }) => {
                        const r = row.original as OrderRow;
                        const short = `${r.id.slice(0, 4)}…`;
                        return (
                            <DetailPageButton
                                href={`/booking/orders/${r.id}`}
                                label={short}
                                className="border"
                            />
                        );
                    },
                },
                customer: {
                    meta: { dependencies: ['customer'] },
                    cell: ({ row }) => {
                        const c = (row.original as OrderRow).customer;
                        if (!c?.id) {
                            return '—';
                        }
                        const label =
                            [c.title, c.firstName, c.lastName].filter(Boolean).join(' ') || c.id;
                        return (
                            <DetailPageButton href={`/customers/${c.id}`} label={label} className="border" />
                        );
                    },
                },
                booking: {
                    meta: { dependencies: ['booking'] },
                    cell: ({ row }) => {
                        const b = (row.original as OrderRow).booking;
                        if (!b?.id) {
                            return '—';
                        }
                        return (
                            <div className="flex items-center gap-2">
                                <VendureImage
                                    asset={b.featuredAsset}
                                    alt={b.name}
                                    preset="tiny"
                                    className="size-9 rounded-md border object-cover"
                                />
                                <DetailPageButton
                                    href={`/booking/services/${b.id}`}
                                    label={b.name}
                                    className="border"
                                />
                            </div>
                        );
                    },
                },
                status: {
                    cell: ({ row }) => {
                        const s = (row.original as OrderRow).status;
                        return (
                            <Badge variant={statusVariant(s)} className="capitalize">
                                {s.replaceAll('_', ' ')}
                            </Badge>
                        );
                    },
                },
            }}
        />
    );
}

import {
    Badge,
    Button,
    DashboardRouteDefinition,
    DetailPageButton,
    ListPage,
    PageActionBarRight,
    VendureImage,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { ResultOf } from '@/gql';
import { AnyRoute, Link } from '@tanstack/react-router';
import { Library, PlusIcon } from 'lucide-react';

import { DeleteBookingsBulkAction } from '../bulk-actions';
import { deleteBookingDocument, getBookingsDocument } from '../documents';

type BookingRow = ResultOf<typeof getBookingsDocument>['bookings']['items'][number];

export const bookingServicesListRoute: DashboardRouteDefinition = {
    path: '/booking/services',
    loader: () => ({ breadcrumb: 'Services' }),
    navMenuItem: {
        sectionId: 'booking',
        id: 'booking-services',
        url: '/booking/services',
        title: 'Services',
        icon: Library,
        requiresPermission: ['ReadBooking'],
    },
    component: (route: AnyRoute) => <BookingServicesListPage route={route} />,
};

function BookingServicesListPage({ route }: { route: AnyRoute }) {
    const { t } = useLingui();
    return (
        <ListPage
            pageId="booking-services-list"
            title={t`Services`}
            listQuery={getBookingsDocument}
            deleteMutation={deleteBookingDocument}
            route={route}
            defaultSort={[{ id: 'name', desc: false }]}
            onSearchTermChange={term => {
                const trimmed = term.trim();
                return trimmed
                    ? {
                          name: { contains: trimmed },
                      }
                    : ({} as any);
            }}
            defaultVisibility={{
                name: true,
                slug: true,
                enabled: true,
                collection: true,
                updatedAt: true,
            }}
            defaultColumnOrder={['name', 'slug', 'enabled', 'collection', 'updatedAt']}
            customizeColumns={{
                id: {
                    cell: ({ row }) => {
                        const r = row.original as BookingRow;
                        const short = `${r.id.slice(0, 4)}…`;
                        return (
                            <DetailPageButton
                                href={`/booking/services/${r.id}`}
                                label={short}
                                className="border"
                            />
                        );
                    },
                },
                name: {
                    cell: ({ row }) => {
                        const r = row.original as BookingRow;
                        return (
                            <div className="flex items-center gap-2">
                                <VendureImage
                                    asset={r.featuredAsset}
                                    alt={r.name}
                                    preset="tiny"
                                    className="size-9 rounded-md border object-cover"
                                />
                                <DetailPageButton
                                    href={`/booking/services/${r.id}`}
                                    label={r.name}
                                    className="border"
                                />
                            </div>
                        );
                    },
                },
                enabled: {
                    cell: ({ row }) => {
                        const on = (row.original as BookingRow).enabled === true;
                        return <Badge variant={on ? 'default' : 'secondary'}>{on ? <Trans>Yes</Trans> : <Trans>No</Trans>}</Badge>;
                    },
                },
                collection: {
                    meta: { dependencies: ['collection'] },
                    cell: ({ row }) => {
                        const c = (row.original as BookingRow).collection;
                        return c?.name ?? '—';
                    },
                },
            }}
            bulkActions={[{ component: DeleteBookingsBulkAction, order: 100 }]}
        >
            <PageActionBarRight>
                <Button render={<Link to="/booking/services/new" />}>
                    <PlusIcon className="mr-2 size-4" />
                    <Trans>New service</Trans>
                </Button>
            </PageActionBarRight>
        </ListPage>
    );
}

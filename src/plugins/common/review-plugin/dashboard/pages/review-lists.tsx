import {
    Badge,
    DashboardRouteDefinition,
    DetailPageButton,
    ListPage,
    VendureImage,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { ResultOf } from '@/gql';
import { AnyRoute } from '@tanstack/react-router';
import { Star } from 'lucide-react';

import { DeleteReviewsBulkAction } from '../bulk-actions';
import { deleteReviewDocument, getReviewsDocument } from '../documents';

type ReviewListItem = ResultOf<typeof getReviewsDocument>['reviews']['items'][number];

type ReviewTypeFilter = 'PRODUCT' | 'SELLER' | 'BOOKING';

function createReviewListRoute(config: {
    path: string;
    title: string;
    navMenuId: string;
    reviewType: ReviewTypeFilter;
    pageId: string;
}): DashboardRouteDefinition {
    const { path, title, navMenuId, reviewType, pageId } = config;

    return {
        path,
        loader: () => ({ breadcrumb: title }),
        navMenuItem: {
            sectionId: 'reviews',
            id: navMenuId,
            url: path,
            title,
            icon: Star,
            requiresPermission: ['ReadReview'],
        },
        component: (route: AnyRoute) => (
            <ListPage
                pageId={pageId}
                title={title}
                listQuery={getReviewsDocument as any}
                deleteMutation={deleteReviewDocument}
                route={route}
                defaultSort={[{ id: 'updatedAt', desc: true }]}
                transformVariables={vars => ({
                    ...vars,
                    options: {
                        ...vars.options,
                        filter: {
                            type: { eq: reviewType },
                            ...vars.options?.filter,
                        },
                    },
                })}
                onSearchTermChange={term =>
                    term.trim() ? { comment: { contains: term.trim() } } : ({} as any)
                }
                defaultVisibility={{
                    ...(reviewType === 'PRODUCT'
                        ? { product: true }
                        : reviewType === 'SELLER'
                          ? { seller: true }
                          : { booking: true }),
                    customer: true,
                    public: true,
                    comment: true,
                    rating: true,
                    updatedAt: true,
                }}
                defaultColumnOrder={
                    reviewType === 'PRODUCT'
                        ? ['product', 'customer', 'public', 'comment', 'rating', 'updatedAt']
                        : reviewType === 'SELLER'
                          ? ['seller', 'customer', 'public', 'comment', 'rating', 'updatedAt']
                          : ['booking', 'customer', 'public', 'comment', 'rating', 'updatedAt']
                }
                customizeColumns={{
                    id: {
                        cell: ({ row }) => {
                            const r = row.original as ReviewListItem;
                            const short = `${r.id.slice(0, 4)}…`;
                            return (
                                <DetailPageButton href={`/reviews/${r.id}`} label={short} className="border" />
                            );
                        },
                    },
                    product: {
                        meta: { dependencies: ['product'] },
                        cell: ({ row }) => {
                            const r = row.original as ReviewListItem;
                            const p = r.product;
                            if (!p?.id) {
                                return '—';
                            }
                            return (
                                <div className="flex items-center gap-2">
                                    <VendureImage
                                        asset={p.featuredAsset}
                                        alt={p.name}
                                        preset="tiny"
                                        className="size-9 rounded-md border object-cover"
                                    />
                                    <DetailPageButton
                                        href={`/products/${p.id}`}
                                        label={p.name}
                                        className="border"
                                    />
                                </div>
                            );
                        },
                    },
                    seller: {
                        meta: { dependencies: ['seller'] },
                        cell: ({ row }) => {
                            const r = row.original as ReviewListItem;
                            const s = r.seller;
                            if (!s?.id) {
                                return '—';
                            }
                            const logo = s.customFields?.logo;
                            return (
                                <div className="flex items-center gap-2">
                                    {logo ? (
                                        <VendureImage
                                            asset={logo}
                                            alt={s.name}
                                            preset="tiny"
                                            className="size-9 rounded-md border object-cover"
                                        />
                                    ) : (
                                        <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md border text-xs">
                                            —
                                        </div>
                                    )}
                                    <DetailPageButton href={`/sellers/${s.id}`} label={s.name} className="border" />
                                </div>
                            );
                        },
                    },
                    booking: {
                        meta: { dependencies: ['booking'] },
                        cell: ({ row }) => {
                            const r = row.original as ReviewListItem;
                            const b = r.booking;
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
                                    <span className="text-sm font-medium">{b.name}</span>
                                </div>
                            );
                        },
                    },
                    customer: {
                        meta: { dependencies: ['customer'] },
                        cell: ({ row }) => {
                            const c = (row.original as ReviewListItem).customer;
                            if (!c?.id) {
                                return '—';
                            }
                            const label = [c.title, c.firstName, c.lastName].filter(Boolean).join(' ') || c.id;
                            return (
                                <DetailPageButton href={`/customers/${c.id}`} label={label} className="border" />
                            );
                        },
                    },
                    public: {
                        cell: ({ row }) => {
                            const pub = (row.original as ReviewListItem).public === true;
                            return (
                                <Badge variant={pub ? 'default' : 'secondary'}>
                                    {pub ? <Trans>Yes</Trans> : <Trans>No</Trans>}
                                </Badge>
                            );
                        },
                    },
                    rating: {
                        cell: ({ row }) => {
                            const v = (row.original as ReviewListItem).rating;
                            return v != null ? `${v}/5` : '—';
                        },
                    },
                }}
                bulkActions={[{ component: DeleteReviewsBulkAction, order: 100 }]}
            />
        ),
    };
}

export const productReviewsListRoute = createReviewListRoute({
    path: '/reviews/products',
    title: 'Product reviews',
    navMenuId: 'reviews-products',
    reviewType: 'PRODUCT',
    pageId: 'review-list-products',
});

export const shopReviewsListRoute = createReviewListRoute({
    path: '/reviews/shops',
    title: 'Shop reviews',
    navMenuId: 'reviews-shops',
    reviewType: 'SELLER',
    pageId: 'review-list-shops',
});

export const bookingReviewsListRoute = createReviewListRoute({
    path: '/reviews/bookings',
    title: 'Booking reviews',
    navMenuId: 'reviews-bookings',
    reviewType: 'BOOKING',
    pageId: 'review-list-bookings',
});

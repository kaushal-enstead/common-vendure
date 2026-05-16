import {
    Button,
    DashboardRouteDefinition,
    DetailFormGrid,
    DetailPageButton,
    FormFieldWrapper,
    Input,
    LabeledData,
    Page,
    PageActionBar,
    PageActionBarRight,
    PageBlock,
    PageLayout,
    PageTitle,
    PermissionGuard,
    Switch,
    Textarea,
    VendureImage,
    detailPageRouteLoader,
    useDetailPage,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { ResultOf } from '@/gql';
import { AnyRoute } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { getReviewDocument, updateReviewDocument } from '../documents';

type ReviewEntity = NonNullable<ResultOf<typeof getReviewDocument>['review']>;

export const reviewDetailRoute: DashboardRouteDefinition = {
    path: '/reviews/$id',
    loader: detailPageRouteLoader({
        queryDocument: getReviewDocument,
        breadcrumb: (_isNew, entity) => {
            if (!entity) {
                return [{ path: '/reviews/products', label: 'Reviews' }];
            }
            const listPath =
                entity.type === 'SELLER'
                    ? '/reviews/shops'
                    : entity.type === 'BOOKING'
                      ? '/reviews/bookings'
                      : '/reviews/products';
            return [{ path: listPath, label: 'Reviews' }, `#${entity.id}`];
        },
    }),
    component: (route: AnyRoute) => <ReviewDetailPage route={route} />,
};

function ReviewDetailPage({ route }: { route: AnyRoute }) {
    const params = route.useParams() as { id: string };
    const { t } = useLingui();

    const { form, submitHandler, entity, isPending, resetForm } = useDetailPage({
        queryDocument: getReviewDocument,
        updateDocument: updateReviewDocument,
        entityField: 'review',
        setValuesForUpdate: (r: ReviewEntity) => ({
            id: r.id,
            rating: r.rating ?? undefined,
            public: r.public ?? false,
            comment: r.comment ?? '',
        }),
        transformUpdateInput: input => ({
            ...input,
            comment: input.comment?.trim() ? input.comment.trim() : null,
        }),
        params: { id: params.id },
        onSuccess: () => {
            toast.success(t`Review updated`);
            resetForm();
        },
        onError: err => {
            toast.error(t`Failed to update review`, {
                description: err instanceof Error ? err.message : t`Unknown error`,
            });
        },
    });

    if (!entity) {
        return (
            <Page pageId="review-detail">
                <PageTitle><Trans>Review</Trans></PageTitle>
            </Page>
        );
    }

    const ratingPreview = form.watch('rating') ?? 0;

    return (
        <Page pageId="review-detail" form={form} submitHandler={submitHandler}>
            <PageTitle>{`Review #${entity.id}`}</PageTitle>
            <PageActionBar>
                <PageActionBarRight>
                    <PermissionGuard requires={['UpdateReview']}>
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty || !form.formState.isValid || isPending}
                        >
                            <Trans>Update</Trans>
                        </Button>
                    </PermissionGuard>
                </PageActionBarRight>
            </PageActionBar>
            <PageLayout>
                <PageBlock column="side" blockId="review-status" title={t`Visibility & rating`}>
                    <FormFieldWrapper
                        control={form.control}
                        name="public"
                        label={t`Published`}
                        render={({ field }) => (
                            <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                        )}
                    />
                    <div className="mt-4">
                        <div className="text-muted-foreground mb-2 text-sm font-medium"><Trans>Rating preview</Trans></div>
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`size-4 ${
                                        i < ratingPreview ? 'fill-primary text-primary' : 'text-muted-foreground'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </PageBlock>
                <PageBlock column="main" blockId="review-context" title={t`Review context`}>
                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        {entity.type === 'PRODUCT' && entity.product && (
                            <LabeledData
                                label={t`Product`}
                                value={
                                    <div className="flex items-center gap-2">
                                        <VendureImage
                                            asset={entity.product.featuredAsset}
                                            alt={entity.product.name}
                                            preset="tiny"
                                            className="size-10 rounded-md border object-cover"
                                        />
                                        <DetailPageButton
                                            href={`/products/${entity.product.id}`}
                                            label={entity.product.name}
                                            className="border"
                                        />
                                    </div>
                                }
                            />
                        )}
                        {entity.type === 'SELLER' && entity.seller && (
                            <LabeledData
                                label={t`Shop`}
                                value={
                                    <div className="flex items-center gap-2">
                                        <VendureImage
                                            asset={entity.seller.customFields?.logo}
                                            alt={entity.seller.name}
                                            preset="tiny"
                                            className="size-10 rounded-md border object-cover"
                                        />
                                        <DetailPageButton
                                            href={`/sellers/${entity.seller.id}`}
                                            label={entity.seller.name}
                                            className="border"
                                        />
                                    </div>
                                }
                            />
                        )}
                        {entity.type === 'BOOKING' && entity.booking && (
                            <LabeledData
                                label={t`Booking`}
                                value={
                                    <div className="flex items-center gap-2">
                                        <VendureImage
                                            asset={entity.booking.featuredAsset}
                                            alt={entity.booking.name}
                                            preset="tiny"
                                            className="size-10 rounded-md border object-cover"
                                        />
                                        <span className="text-sm font-medium">{entity.booking.name}</span>
                                    </div>
                                }
                            />
                        )}
                        {entity.customer && (
                            <LabeledData
                                label={t`Customer`}
                                value={
                                    <DetailPageButton
                                        href={`/customers/${entity.customer.id}`}
                                        label={
                                            [
                                                entity.customer.title,
                                                entity.customer.firstName,
                                                entity.customer.lastName,
                                            ]
                                                .filter(Boolean)
                                                .join(' ') || entity.customer.id
                                        }
                                        className="border"
                                    />
                                }
                            />
                        )}
                    </div>
                    <DetailFormGrid>
                        <FormFieldWrapper
                            control={form.control}
                            name="rating"
                            label={t`Rating (1–5)`}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min={1}
                                    max={5}
                                    step={0.1}
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => {
                                        const v = e.target.value;
                                        field.onChange(v === '' ? undefined : Number.parseFloat(v));
                                    }}
                                />
                            )}
                        />
                    </DetailFormGrid>
                    <div className="mt-6 space-y-6">
                        <FormFieldWrapper
                            control={form.control}
                            name="comment"
                            label={t`Comment`}
                            render={({ field }) => <Textarea {...field} value={field.value ?? ''} rows={6} />}
                        />
                    </div>
                </PageBlock>
            </PageLayout>
        </Page>
    );
}

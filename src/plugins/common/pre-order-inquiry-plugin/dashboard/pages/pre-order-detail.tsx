import {
    Badge,
    Button,
    DashboardRouteDefinition,
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
    Textarea,
    api,
    detailPageRouteLoader,
    useLocalFormat,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnyRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getPreOrderDocument, updatePreOrderDocument } from '../documents';

type PreOrderStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'REFUSED'
    | 'CHANGE_PROPOSED'
    | 'COMPLETED'
    | 'CUSTOMER_ACCEPTED';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'ACCEPTED':
        case 'COMPLETED':
        case 'CUSTOMER_ACCEPTED':
            return 'default';
        case 'REFUSED':
            return 'destructive';
        case 'CHANGE_PROPOSED':
            return 'outline';
        default:
            return 'secondary';
    }
}

const TERMINAL_STATUSES: PreOrderStatus[] = ['CUSTOMER_ACCEPTED', 'COMPLETED', 'REFUSED'];

export const preOrderDetailRoute: DashboardRouteDefinition = {
    path: '/pre-orders/$id',
    loader: detailPageRouteLoader({
        queryDocument: getPreOrderDocument,
        breadcrumb: (_isNew, entity) => [
            { path: '/pre-orders', label: 'Pre-orders' },
            entity?.id ? `#${entity.id.slice(0, 8)}` : 'Pre-order',
        ],
    }),
    component: (route: AnyRoute) => <PreOrderDetailPage route={route} />,
};

function PreOrderDetailPage({ route }: { route: AnyRoute }) {
    const params = route.useParams() as { id: string };
    const { t } = useLingui();
    const { formatCurrency, formatDate } = useLocalFormat();

    const preOrderQuery = useQuery({
        queryKey: ['DashboardGetPreOrder', params.id],
        queryFn: () => api.query(getPreOrderDocument, { id: params.id }),
    });

    const entity = preOrderQuery.data?.preOrder;

    const form = useForm<{ quantity: number; message: string }>({
        defaultValues: { quantity: 0, message: '' },
    });

    useEffect(() => {
        if (!entity) return;
        form.reset({
            quantity: entity.quantity ?? 0,
            message: entity.message ?? '',
        });
    }, [entity, form]);

    const updateMutation = useMutation({
        mutationFn: (status: PreOrderStatus) => {
            const { quantity, message } = form.getValues();
            return api.mutate(updatePreOrderDocument, {
                input: { id: params.id, quantity, message, status },
            });
        },
        onSuccess: () => {
            void preOrderQuery.refetch();
        },
        onError: (err: unknown) => {
            toast.error(t`Failed to update pre-order`, {
                description: err instanceof Error ? err.message : t`Unknown error`,
            });
        },
    });

    const handleAccept = () => {
        updateMutation.mutate('ACCEPTED', {
            onSuccess: () => toast.success(t`Pre-order accepted successfully`),
        });
    };

    const handleProposeChange = () => {
        updateMutation.mutate('CHANGE_PROPOSED', {
            onSuccess: () => toast.success(t`Pre-order change proposed successfully`),
        });
    };

    const handleCancel = () => {
        updateMutation.mutate('REFUSED', {
            onSuccess: () => toast.success(t`Pre-order cancelled successfully`),
        });
    };

    const isTerminal = TERMINAL_STATUSES.includes((entity?.status ?? '') as PreOrderStatus);
    const isPending = updateMutation.isPending;

    if (preOrderQuery.isLoading || !entity) {
        return (
            <Page pageId="pre-order-detail">
                <PageTitle><Trans>Pre-order</Trans></PageTitle>
            </Page>
        );
    }

    const pv = entity.productVariant;
    const customer = entity.customer;
    const customerLabel = customer
        ? [customer.title, customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.id
        : '—';

    return (
        <Page pageId="pre-order-detail" form={form}>
            <PageTitle>{pv?.name ? `Pre-order: ${pv.name}` : `Pre-order #${entity.id.slice(0, 8)}`}</PageTitle>
            <PageActionBar>
                <PageActionBarRight>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="default"
                            disabled={isTerminal || isPending}
                            onClick={handleAccept}
                        >
                            <Trans>Accept</Trans>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isTerminal || isPending}
                            onClick={handleProposeChange}
                        >
                            <Trans>Propose Change</Trans>
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isTerminal || isPending}
                            onClick={handleCancel}
                        >
                            <Trans>Cancel</Trans>
                        </Button>
                    </div>
                </PageActionBarRight>
            </PageActionBar>
            <PageLayout>
                <PageBlock column="side" blockId="pre-order-status" title={t`Status`}>
                    <Badge variant={statusVariant(entity.status)} className="capitalize">
                        {entity.status.toLowerCase().replaceAll('_', ' ')}
                    </Badge>
                </PageBlock>

                <PageBlock column="main" blockId="pre-order-details" title={t`Details`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <LabeledData
                            label={t`Product Variant`}
                            value={
                                pv?.product?.id && pv?.id ? (
                                    <DetailPageButton
                                        href={`/catalog/products/${pv.product.id}/variants/${pv.id}`}
                                        label={pv.name}
                                        className="border"
                                    />
                                ) : (
                                    pv?.name ?? '—'
                                )
                            }
                        />
                        {pv && (
                            <LabeledData
                                label={t`Price`}
                                value={formatCurrency(pv.priceWithTax, pv.currencyCode)}
                            />
                        )}
                        <LabeledData
                            label={t`Customer`}
                            value={
                                customer?.id ? (
                                    <DetailPageButton
                                        href={`/customers/${customer.id}`}
                                        label={customerLabel}
                                        className="border"
                                    />
                                ) : (
                                    customerLabel
                                )
                            }
                        />
                        <LabeledData
                            label={t`Created At`}
                            value={entity.createdAt ? formatDate(entity.createdAt) : '—'}
                        />
                        <LabeledData
                            label={t`Accepted At`}
                            value={entity.acceptedAt ? formatDate(entity.acceptedAt) : '—'}
                        />
                    </div>
                    <div className="mt-6">
                        <FormFieldWrapper
                            control={form.control}
                            name="quantity"
                            label={t`Quantity`}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    min={1}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                />
                            )}
                        />
                    </div>
                </PageBlock>

                <PageBlock column="main" blockId="pre-order-message" title={t`Conversation`}>
                    <FormFieldWrapper
                        control={form.control}
                        name="message"
                        label={t`Message`}
                        render={({ field }) => (
                            <Textarea {...field} value={field.value ?? ''} rows={10} placeholder={t`Message…`} />
                        )}
                    />
                </PageBlock>
            </PageLayout>
        </Page>
    );
}

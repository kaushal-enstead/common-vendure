import {
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    api,
    detailPageRouteLoader,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnyRoute } from '@tanstack/react-router';
import { useEffect, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { addOrderCommentDocument, getBookingOrderDocument } from '../documents';

const STATUS_OPTIONS = ['pending', 'accepted', 'refused', 'change_proposed'] as const;

export const bookingOrderDetailRoute: DashboardRouteDefinition = {
    path: '/booking/orders/$id',
    loader: detailPageRouteLoader({
        queryDocument: getBookingOrderDocument,
        breadcrumb: (_isNew, entity) => [
            { path: '/booking/orders', label: 'Booking orders' },
            entity?.booking?.name ? `${entity.booking.name}` : (entity?.id?.slice(0, 8) ?? ''),
        ],
    }),
    component: (route: AnyRoute) => <BookingOrderDetailPage route={route} />,
};

function BookingOrderDetailPage({ route }: { route: AnyRoute }) {
    const params = route.useParams() as { id: string };
    const { t } = useLingui();

    const orderQuery = useQuery({
        queryKey: ['DashboardBookingOrder', params.id],
        queryFn: () => api.query(getBookingOrderDocument, { id: params.id }),
    });

    const entity = orderQuery.data?.bookingOrder;

    const form = useForm<{ status: string; message: string }>({
        defaultValues: { status: 'pending', message: '' },
    });

    useEffect(() => {
        if (!entity) {
            return;
        }
        form.reset({
            status: entity.status ?? 'pending',
            message: '',
        });
    }, [entity, form]);

    const updateMutation = useMutation({
        mutationFn: () => {
            const { status, message } = form.getValues();
            const trimmed = message?.trim();
            return api.mutate(addOrderCommentDocument, {
                input: {
                    id: params.id,
                    status,
                    comment: trimmed
                        ? {
                              type: 'vendor',
                              message: trimmed,
                              createdAt: new Date().toISOString(),
                          }
                        : null,
                },
            });
        },
        onSuccess: () => {
            toast.success(t`Order updated`);
            void orderQuery.refetch();
            form.setValue('message', '');
        },
        onError: (err: unknown) => {
            toast.error(t`Update failed`, {
                description: err instanceof Error ? err.message : t`Unknown error`,
            });
        },
    });

    const submitHandler = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateMutation.mutate();
    };

    if (orderQuery.isLoading || !entity) {
        return (
            <Page pageId="booking-order-detail">
                <PageTitle><Trans>Booking order</Trans></PageTitle>
            </Page>
        );
    }

    const formValues: Record<string, string> = {};
    for (const v of entity.formValues ?? []) {
        formValues[v.fieldId] = v.value;
    }

    const customer = entity.customer;
    const customerLabel = customer
        ? [customer.title, customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
          customer.emailAddress ||
          customer.id
        : '—';

    return (
        <Page pageId="booking-order-detail" form={form} submitHandler={submitHandler}>
            <PageTitle>{entity.booking?.name ?? <Trans>Booking order</Trans>}</PageTitle>
            <PageActionBar>
                <PageActionBarRight>
                    <Button
                        type="submit"
                        disabled={
                            updateMutation.isPending ||
                            (!form.formState.isDirty && !(form.getValues('message') ?? '').trim())
                        }
                    >
                        <Trans>Update</Trans>
                    </Button>
                </PageActionBarRight>
            </PageActionBar>
            <PageLayout>
                <PageBlock column="side" blockId="booking-order-status" title={t`Status`}>
                    <FormFieldWrapper
                        control={form.control}
                        name="status"
                        label={t`Status`}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(s => (
                                        <SelectItem key={s} value={s} className="capitalize">
                                            {s.replaceAll('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </PageBlock>

                <PageBlock column="main" blockId="booking-order-summary" title={t`Summary`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <LabeledData label={t`Service`} value={entity.booking?.name ?? '—'} />
                        <LabeledData
                            label={t`Customer`}
                            value={
                                <div className="flex items-center gap-2">
                                    <span>{customerLabel}</span>
                                    {customer?.id && (
                                        <DetailPageButton
                                            href={`/customers/${customer.id}`}
                                            label={t`View`}
                                            className="border"
                                        />
                                    )}
                                </div>
                            }
                        />
                    </div>
                </PageBlock>

                <PageBlock column="main" blockId="booking-order-comments" title={t`Comments`}>
                    <div className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded-md border p-3">
                        {(entity.comments ?? []).length === 0 ? (
                            <p className="text-muted-foreground text-sm"><Trans>No comments yet.</Trans></p>
                        ) : (
                            (entity.comments ?? []).map((c, i) => (
                                <div
                                    key={`${c.createdAt ?? i}-${i}`}
                                    className={`rounded-lg border p-3 text-sm ${
                                        c.type === 'customer' ? 'bg-muted/40' : 'bg-primary/5'
                                    }`}
                                >
                                    <div className="mb-1 font-medium capitalize">{c.type ?? 'note'}</div>
                                    <p className="text-foreground/90">{c.message}</p>
                                    {c.createdAt && (
                                        <div className="text-muted-foreground mt-1 text-xs">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <FormFieldWrapper
                        control={form.control}
                        name="message"
                        label={t`Add vendor message`}
                        render={({ field }) => <Input {...field} placeholder={t`Message…`} />}
                    />
                </PageBlock>

                <PageBlock
                    column="main"
                    blockId="booking-order-form-values"
                    title={`Form: ${entity.booking?.form?.name ?? '—'}`}
                >
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                    <th className="p-2 font-medium"><Trans>Label</Trans></th>
                                    <th className="p-2 font-medium"><Trans>Type</Trans></th>
                                    <th className="p-2 font-medium"><Trans>Value</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(entity.booking?.form?.fields ?? []).map((f: any) => (
                                    <tr key={f.id} className="border-b last:border-0">
                                        <td className="p-2">{f.label}</td>
                                        <td className="p-2">{f.type}</td>
                                        <td className="p-2">{formValues[f.id] ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </PageBlock>
            </PageLayout>
        </Page>
    );
}

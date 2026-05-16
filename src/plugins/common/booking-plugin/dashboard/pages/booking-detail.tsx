import { ResultOf } from '@/gql';
import { normalizeString } from '@vendure/common/lib/normalize-string';
import {
    Button,
    CheckboxInput,
    DashboardRouteDefinition,
    DetailFormGrid,
    EntityAssets,
    type EntityAssetValue,
    FacetValueChip,
    FacetValueSelector,
    FormFieldWrapper,
    Input,
    Page,
    PageActionBar,
    PageActionBarLeft,
    PageActionBarRight,
    PageBlock,
    PageLayout,
    PageTitle,
    PermissionGuard,
    RichTextInput,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    api,
    detailPageRouteLoader,
    usePermissions,
    useUserSettings,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnyRoute, useNavigate } from '@tanstack/react-router';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
    createBookingDocument,
    getActiveAdministratorForSlugDocument,
    getBookingDocument,
    getCollectionsForBookingDocument,
    getFormsForBookingDocument,
    updateBookingDocument,
} from '../documents';

type BookingEntity = NonNullable<ResultOf<typeof getBookingDocument>['booking']>;

type FacetRow = {
    id: string;
    name: string;
    code: string;
    facet: { id: string; name: string; code: string };
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type DayKey = (typeof DAY_KEYS)[number];

type BookingFormValues = {
    name: string;
    slug: string;
    description: string;
    enabled: boolean;
    collectionId: string;
    formId: string;
    availableDays: Record<DayKey, boolean>;
    availableHours: { from: string; to: string }[];
    seo: { title: string; description: string; keywords: string };
};

function emptyDays(): Record<DayKey, boolean> {
    return {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
    };
}

function mapEntityToForm(entity: BookingEntity): BookingFormValues {
    return {
        name: entity.name ?? '',
        slug: entity.slug ?? '',
        description: entity.description ?? '',
        enabled: entity.enabled ?? false,
        collectionId: entity.collection?.id ?? '',
        formId: entity.form?.id ?? '',
        availableDays: { ...emptyDays(), ...(entity.availableDays as Record<DayKey, boolean>) },
        availableHours: (entity.availableHours ?? []).map(h => ({
            from: h.from ?? '',
            to: h.to ?? '',
        })),
        seo: {
            title: entity.seo?.title ?? '',
            description: entity.seo?.description ?? '',
            keywords: entity.seo?.keywords ?? '',
        },
    };
}

function mapFacetValues(entity: BookingEntity): FacetRow[] {
    return (entity.facetValues ?? []).map(fv => ({
        id: fv.id,
        name: fv.name,
        code: fv.code,
        facet: {
            id: fv.facet.id,
            name: fv.facet.name,
            code: fv.facet.code,
        },
    }));
}

export const bookingServiceDetailRoute: DashboardRouteDefinition = {
    path: '/booking/services/$id',
    loader: detailPageRouteLoader({
        queryDocument: getBookingDocument,
        breadcrumb: (isNew, entity) => [
            { path: '/booking/services', label: 'Services' },
            isNew ? 'New' : (entity?.name ?? ''),
        ],
    }),
    component: (route: AnyRoute) => <BookingServiceDetailPage route={route} />,
};

function BookingServiceDetailPage({ route }: { route: AnyRoute }) {
    const params = route.useParams() as { id: string };
    const navigate = useNavigate();
    const { t } = useLingui();
    const isNew = params.id === 'new';
    const { settings } = useUserSettings();
    const contentLanguage = settings.contentLanguage;
    const { hasPermissions } = usePermissions();
    const canCreate = hasPermissions(['CreateBooking']);
    const canUpdate = hasPermissions(['UpdateBooking']);

    const [facets, setFacets] = useState<FacetRow[]>([]);
    const [assetSelection, setAssetSelection] = useState<EntityAssetValue>({});
    const [extrasDirty, setExtrasDirty] = useState(false);
    const slugEditedRef = useRef(false);

    const bookingQuery = useQuery({
        queryKey: ['DashboardBooking', params.id, contentLanguage],
        queryFn: () => api.query(getBookingDocument, { id: params.id }),
        enabled: !isNew,
    });

    const entity = bookingQuery.data?.booking;

    const formsQuery = useQuery({
        queryKey: ['DashboardBookingForms'],
        queryFn: () => api.query(getFormsForBookingDocument, {}),
    });

    const collectionsQuery = useQuery({
        queryKey: ['DashboardBookingCollections'],
        queryFn: () => api.query(getCollectionsForBookingDocument, {}),
    });

    const adminQuery = useQuery({
        queryKey: ['DashboardBookingAdminSlug'],
        queryFn: () => api.query(getActiveAdministratorForSlugDocument, {}),
        enabled: isNew,
    });

    const adminIdentifier = adminQuery.data?.activeAdministrator?.user?.identifier ?? 'admin';

    const form = useForm<BookingFormValues>({
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            enabled: false,
            collectionId: '',
            formId: '',
            availableDays: emptyDays(),
            availableHours: [],
            seo: { title: '', description: '', keywords: '' },
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'availableHours',
    });

    useEffect(() => {
        if (!entity) {
            return;
        }
        form.reset(mapEntityToForm(entity));
        setFacets(mapFacetValues(entity));
        setAssetSelection({
            assetIds: entity.assets?.map(a => a.id) ?? [],
            featuredAssetId: entity.featuredAsset?.id ?? undefined,
        });
        setExtrasDirty(false);
        slugEditedRef.current = false;
    }, [entity, form]);

    useEffect(() => {
        if (!isNew) {
            return;
        }
        setFacets([]);
        setAssetSelection({});
        setExtrasDirty(false);
        slugEditedRef.current = false;
        form.reset({
            name: '',
            slug: '',
            description: '',
            enabled: false,
            collectionId: '',
            formId: '',
            availableDays: emptyDays(),
            availableHours: [],
            seo: { title: '', description: '', keywords: '' },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset new-entity form when entering create mode
    }, [isNew]);

    const selectedFormFields = useMemo(() => {
        const formId = form.watch('formId');
        const items = formsQuery.data?.forms?.items ?? [];
        return items.find(f => f.id === formId)?.fields ?? entity?.form?.fields ?? [];
    }, [form, formsQuery.data?.forms?.items, entity?.form?.fields]);

    const createMutation = useMutation({
        mutationFn: (input: Record<string, unknown>) => api.mutate(createBookingDocument as any, { input }),
        onSuccess: (data: any) => {
            const created = data?.createBooking;
            if (created?.id) {
                toast.success(t`Service created`);
                void navigate({ to: '/booking/services/$id', params: { id: created.id } });
            }
        },
        onError: (err: unknown) => {
            toast.error(t`Failed to create`, {
                description: err instanceof Error ? err.message : t`Unknown error`,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (input: Record<string, unknown>) => api.mutate(updateBookingDocument as any, { input }),
        onSuccess: () => {
            toast.success(t`Service updated`);
            void bookingQuery.refetch();
            setExtrasDirty(false);
        },
        onError: (err: unknown) => {
            toast.error(t`Failed to update`, {
                description: err instanceof Error ? err.message : t`Unknown error`,
            });
        },
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const buildTranslationInput = (values: BookingFormValues) => ({
        languageCode: contentLanguage as any,
        name: values.name,
        slug: values.slug,
        description: values.description,
        seo: {
            title: values.seo.title,
            description: values.seo.description,
            keywords: values.seo.keywords,
        },
    });

    const onSave = (values: BookingFormValues) => {
        const facetValueIds = facets.map(f => f.id);
        const hours = values.availableHours ?? [];

        if (isNew) {
            if (!canCreate) {
                return;
            }
            createMutation.mutate({
                enabled: values.enabled,
                formId: values.formId,
                collectionId: values.collectionId,
                facetValueIds,
                availableHours: hours,
                availableDays: values.availableDays,
                assetIds: assetSelection.assetIds?.length ? assetSelection.assetIds : [],
                featuredAssetId: assetSelection.featuredAssetId || undefined,
                translations: [buildTranslationInput(values)],
            });
        } else {
            if (!entity || !canUpdate) {
                return;
            }
            updateMutation.mutate({
                id: entity.id,
                enabled: values.enabled,
                formId: values.formId,
                collectionId: values.collectionId,
                facetValueIds,
                availableHours: hours,
                availableDays: values.availableDays,
                assetIds:
                    assetSelection.assetIds != null
                        ? assetSelection.assetIds
                        : (entity.assets?.map(a => a.id) ?? []),
                featuredAssetId:
                    assetSelection.featuredAssetId != null
                        ? assetSelection.featuredAssetId
                        : (entity.featuredAsset?.id ?? ''),
                translations: [buildTranslationInput(values)],
            });
        }
    };

    const submitHandler = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void form.handleSubmit(onSave)();
    };

    const collections = collectionsQuery.data?.collections?.items ?? [];
    const formOptions = formsQuery.data?.forms?.items ?? [];

    const updateSlugFromName = (name: string) => {
        if (slugEditedRef.current) {
            return;
        }
        const base = `${adminIdentifier}-${name}`;
        form.setValue('slug', normalizeString(base, '-'), { shouldDirty: true });
    };

    const formDirty = form.formState.isDirty || extrasDirty;
    const scheduleFieldsDisabled = !isNew && !canUpdate;

    const toggleAvailableDay = (day: DayKey) => {
        const current = form.getValues(`availableDays.${day}`);
        form.setValue(`availableDays.${day}`, !current, { shouldDirty: true });
    };

    if (!isNew && bookingQuery.isLoading) {
        return (
            <Page pageId="booking-service-detail">
                <PageTitle><Trans>Service</Trans></PageTitle>
            </Page>
        );
    }

    if (!isNew && !entity) {
        return (
            <Page pageId="booking-service-detail">
                <PageTitle><Trans>Service</Trans></PageTitle>
            </Page>
        );
    }

    return (
        <Page pageId="booking-service-detail" form={form} submitHandler={submitHandler}>
            <PageTitle>{isNew ? <Trans>New service</Trans> : (entity?.name ?? <Trans>Service</Trans>)}</PageTitle>
            <PageActionBar>
                <PageActionBarRight>
                    <PermissionGuard requires={isNew ? ['CreateBooking'] : ['UpdateBooking']}>
                        <Button type="submit" disabled={!formDirty || !form.formState.isValid || isPending}>
                            {isNew ? <Trans>Create</Trans> : <Trans>Update</Trans>}
                        </Button>
                    </PermissionGuard>
                </PageActionBarRight>
            </PageActionBar>
            <PageLayout>
                <PageBlock column="side" blockId="booking-facets" title={t`Facets`}>
                    <div className="flex flex-wrap gap-2">
                        {facets.map(fv => (
                            <FacetValueChip
                                key={fv.id}
                                facetValue={fv}
                                removable={!isNew ? canUpdate : canCreate}
                                onRemove={id => {
                                    setFacets(prev => prev.filter(f => f.id !== id));
                                    setExtrasDirty(true);
                                }}
                            />
                        ))}
                    </div>
                    {(isNew ? canCreate : canUpdate) && (
                        <div className="mt-3">
                            <FacetValueSelector
                                placeholder={t`Add facet value…`}
                                onValueSelect={fv => {
                                    setFacets(prev =>
                                        prev.some(p => p.id === fv.id)
                                            ? prev
                                            : [
                                                  ...prev,
                                                  {
                                                      id: fv.id,
                                                      name: fv.name,
                                                      code: fv.code,
                                                      facet: fv.facet,
                                                  },
                                              ],
                                    );
                                    setExtrasDirty(true);
                                }}
                            />
                        </div>
                    )}
                </PageBlock>

                <PageBlock column="side" blockId="booking-status" title={t`Status & schedule`}>
                    <FormFieldWrapper
                        control={form.control}
                        name="enabled"
                        label={t`Enabled`}
                        render={({ field }) => (
                            <Switch
                                checked={field.value === true}
                                onCheckedChange={v => field.onChange(v)}
                                disabled={!isNew && !canUpdate}
                            />
                        )}
                    />
                    <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium"><Trans>Available days</Trans></div>
                        <div className="flex flex-col gap-2">
                            {DAY_KEYS.map(day => (
                                <label key={day} className="flex items-center gap-2 text-sm capitalize">
                                    <CheckboxInput
                                        name={`availableDays.${day}`}
                                        onBlur={() => {}}
                                        ref={() => {}}
                                        disabled={scheduleFieldsDisabled}
                                        value={form.watch(`availableDays.${day}`)}
                                        onChange={() => toggleAvailableDay(day)}
                                    />
                                    {day}
                                </label>
                            ))}
                        </div>
                    </div>
                </PageBlock>

                <PageBlock column="side" blockId="booking-available-slots" className="shadow-sm">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold leading-none"><Trans>Available slots</Trans></span>
                            {(isNew ? canCreate : canUpdate) && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 gap-1 rounded-full px-3 text-xs font-medium"
                                    onClick={() => append({ from: '', to: '' })}
                                >
                                    <Plus className="size-3.5 shrink-0" />
                                    <Trans>New</Trans>
                                </Button>
                            )}
                        </div>
                        {fields.length === 0 ? (
                            <p className="text-muted-foreground px-0.5 py-2 text-center text-xs leading-relaxed">
                                <Trans>No slots yet. Use New to add availability windows.</Trans>
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {fields.map((slot, index) => (
                                    <div
                                        key={slot.id}
                                        className="bg-muted/30 space-y-3 rounded-lg border p-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold"><Trans>Slot {index + 1}</Trans></span>
                                            {(isNew ? canCreate : canUpdate) && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="text-muted-foreground size-7 shrink-0 rounded-full border"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Minus className="size-3.5" />
                                                    <span className="sr-only">Remove slot {index + 1}</span>
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="min-w-0 space-y-1.5">
                                                <span className="text-muted-foreground block text-xs font-medium">
                                                    <Trans>From</Trans>
                                                </span>
                                                <FormFieldWrapper
                                                    control={form.control}
                                                    name={`availableHours.${index}.from`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            disabled={scheduleFieldsDisabled}
                                                            placeholder="18:30"
                                                            className="h-9 rounded-md text-sm"
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div className="min-w-0 space-y-1.5">
                                                <span className="text-muted-foreground block text-xs font-medium">
                                                    <Trans>To</Trans>
                                                </span>
                                                <FormFieldWrapper
                                                    control={form.control}
                                                    name={`availableHours.${index}.to`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            disabled={scheduleFieldsDisabled}
                                                            placeholder="00:30"
                                                            className="h-9 rounded-md text-sm"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </PageBlock>

                <PageBlock column="main" blockId="booking-main" title={t`Details`}>
                    <DetailFormGrid>
                        <FormFieldWrapper
                            control={form.control}
                            name="name"
                            label={t`Name`}
                            rules={{ required: t`Name is required` }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    onChange={e => {
                                        field.onChange(e);
                                        if (isNew) {
                                            updateSlugFromName(e.target.value);
                                        }
                                    }}
                                />
                            )}
                        />
                        <FormFieldWrapper
                            control={form.control}
                            name="slug"
                            label={t`Slug`}
                            rules={{ required: t`Slug is required` }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    onChange={e => {
                                        slugEditedRef.current = true;
                                        field.onChange(e);
                                    }}
                                />
                            )}
                        />
                        <FormFieldWrapper
                            control={form.control}
                            name="collectionId"
                            label={t`Collection`}
                            rules={{ required: t`Collection is required` }}
                            renderFormControl={false}
                            render={({ field }) => (
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                    <SelectTrigger id={`field-${field.name}`}>
                                        <SelectValue placeholder={t`Select collection`} >
                                            {field.value ? collections.find(c => c.id === field.value)?.name : t`Select collection`}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </DetailFormGrid>
                    <div className="mt-6">
                        <FormFieldWrapper
                            control={form.control}
                            name="description"
                            label={t`Description`}
                            render={({ field }) => (
                                <RichTextInput
                                    {...field}
                                    value={field.value ?? ''}
                                    disabled={!isNew && !canUpdate}
                                />
                            )}
                        />
                    </div>
                </PageBlock>

                <PageBlock column="main" blockId="booking-seo-form" title={t`SEO & reservation form`}>
                    <div className="grid gap-8 md:grid-cols-2 md:items-start">
                        <div className="space-y-4">
                            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                                <Trans>SEO</Trans>
                            </h3>
                            <DetailFormGrid>
                                <FormFieldWrapper
                                    control={form.control}
                                    name="seo.title"
                                    label={t`Title`}
                                    render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                                />
                                <FormFieldWrapper
                                    control={form.control}
                                    name="seo.keywords"
                                    label={t`Keywords`}
                                    render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                                />
                            </DetailFormGrid>
                            <FormFieldWrapper
                                control={form.control}
                                name="seo.description"
                                label={t`SEO description`}
                                render={({ field }) => (
                                    <RichTextInput
                                        {...field}
                                        value={field.value ?? ''}
                                        disabled={!isNew && !canUpdate}
                                    />
                                )}
                            />
                        </div>
                        <div className="flex max-h-[28rem] flex-col gap-4 overflow-hidden md:pl-2">
                            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                                <Trans>Form selection</Trans>
                            </h3>
                            <FormFieldWrapper
                                control={form.control}
                                name="formId"
                                label={t`Reservation form`}
                                description="Form shown to customers when they book this service."
                                rules={{ required: t`Select a reservation form` }}
                                renderFormControl={false}
                                render={({ field }) => {
                                    return (
                                        <div className="space-y-2">
                                            <Select
                                                value={field.value || ''}
                                                onValueChange={v => {
                                                    field.onChange(v);
                                                }}
                                            >
                                                <SelectTrigger id={`field-${field.name}`} className="w-full">
                                                    <SelectValue placeholder={t`Select reservation form`} >
                                                        {field.value ? formOptions.find(f => f.id === field.value)?.name : t`Select reservation form`}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formOptions.map(f => (
                                                        <SelectItem label={f.name} key={f.id} value={f.id}>
                                                            {f.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formOptions.length === 0 && (
                                                <p className="text-muted-foreground text-sm">
                                                    <Trans>No forms found. Create a form in the booking plugin first.</Trans>
                                                </p>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-muted/95">
                                        <tr className="border-b text-left">
                                            <th className="p-2 font-medium"><Trans>Name</Trans></th>
                                            <th className="p-2 font-medium"><Trans>Type</Trans></th>
                                            <th className="p-2 font-medium"><Trans>Description</Trans></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedFormFields ?? []).length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="text-muted-foreground p-4 text-center text-sm"
                                                >
                                                    <Trans>Select a reservation form to preview its fields.</Trans>
                                                </td>
                                            </tr>
                                        ) : (
                                            (selectedFormFields ?? []).map((f: any) => (
                                                <tr key={f.id} className="border-b last:border-0">
                                                    <td className="p-2">{f.name}</td>
                                                    <td className="p-2">{f.type}</td>
                                                    <td className="p-2 text-muted-foreground">
                                                        {f.description}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </PageBlock>

                <PageBlock column="main" blockId="booking-assets" title={t`Assets`}>
                    <EntityAssets
                        key={entity?.id ?? 'new'}
                        assets={(entity?.assets ?? []) as any}
                        featuredAsset={(entity?.featuredAsset ?? undefined) as any}
                        multiSelect
                        updatePermissions={isNew ? canCreate : canUpdate}
                        onChange={next => {
                            setAssetSelection(next);
                            setExtrasDirty(true);
                        }}
                    />
                </PageBlock>
            </PageLayout>
        </Page>
    );
}

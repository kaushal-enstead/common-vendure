import {
    api,
    Checkbox,
    FieldLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { sellerFacetsCollectionsDocument } from '../documents';

type FacetValueOption = { id: string; name: string; facetName: string };

export function SellerFacetsCollectionsBlock({
    context,
}: {
    context: { form?: UseFormReturn<any>; entity?: any };
}) {
    const { t } = useLingui();
    const form = context.form;
    const entity = context.entity;

    const { data } = useQuery({
        queryKey: ['seller-facets-collections-dash'],
        queryFn: () => api.query(sellerFacetsCollectionsDocument, {}),
    });

    const facetValueOptions = useMemo(() => {
        const items = data?.facets?.items ?? [];
        const out: FacetValueOption[] = [];
        for (const facet of items) {
            for (const val of facet.values ?? []) {
                out.push({ id: val.id, name: val.name, facetName: facet.name });
            }
        }
        return out.sort((a, b) => `${a.facetName} ${a.name}`.localeCompare(`${b.facetName} ${b.name}`));
    }, [data]);

    const collections = data?.collections?.items ?? [];

    const customFields = form ? form.watch('customFields') : undefined;

    const selectedIds: string[] = useMemo(() => {
        const direct = customFields?.facetValueIds;
        if (Array.isArray(direct) && direct.length) {
            return direct.map(String);
        }
        const rel = customFields?.facetValue;
        if (Array.isArray(rel)) {
            return rel.map((x: { id?: string }) => String(x.id)).filter(Boolean);
        }
        return [];
    }, [customFields?.facetValueIds, customFields?.facetValue]);

    const collectionId = customFields?.collectionId != null ? String(customFields.collectionId) : '';

    useEffect(() => {
        if (!form || !entity?.customFields) {
            return;
        }
        const cf = entity.customFields as Record<string, unknown>;
        const hasIds = Array.isArray(cf.facetValueIds) && cf.facetValueIds.length;
        const rel = cf.facetValue;
        if (!hasIds && Array.isArray(rel)) {
            const ids = rel.map((x: { id?: string }) => x.id).filter(Boolean) as string[];
            if (ids.length) {
                form.setValue('customFields.facetValueIds', ids, { shouldDirty: false });
            }
        }
    }, [entity, form]);

    if (!form) {
        return null;
    }

    const toggleFacetValue = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        form.setValue('customFields.facetValueIds', [...next], { shouldDirty: true });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <FieldLabel className="text-sm font-medium"><Trans>Facet values</Trans></FieldLabel>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                    {facetValueOptions.length === 0 ? (
                        <p className="text-muted-foreground text-sm"><Trans>Loading facet values…</Trans></p>
                    ) : (
                        facetValueOptions.map(fv => (
                            <label key={fv.id} className="flex cursor-pointer items-start gap-2 text-sm">
                                <Checkbox
                                    checked={selectedIds.includes(fv.id)}
                                    onCheckedChange={c => toggleFacetValue(fv.id, c === true)}
                                />
                                <span>
                                    <span className="text-muted-foreground">{fv.facetName}: </span>
                                    {fv.name}
                                </span>
                            </label>
                        ))
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <FieldLabel className="text-sm font-medium"><Trans>Collection</Trans></FieldLabel>
                <Select
                    value={collectionId || '__none__'}
                    onValueChange={v => {
                        form.setValue('customFields.collectionId', v === '__none__' ? undefined : v, {
                            shouldDirty: true,
                        });
                    }}
                >
                    <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder={t`Select collection`} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__"><Trans>None</Trans></SelectItem>
                        {collections.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

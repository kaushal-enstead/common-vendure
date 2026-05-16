import { api, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';

import { sellerCollectionsDocument } from '../documents';

export function SellerCollectionBlock({ context }: { context: { form?: UseFormReturn<any> } }) {
    const { t } = useLingui();
    const form = context.form;

    const { data } = useQuery({
        queryKey: ['seller-collections-dash'],
        queryFn: () => api.query(sellerCollectionsDocument, {}),
    });

    const collections = data?.collections?.items ?? [];

    if (!form) {
        return null;
    }

    const customFields = form.watch('customFields');
    const collectionId = customFields?.collectionId != null ? String(customFields.collectionId) : '';

    return (
        <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
                <Trans>Choose the catalog collection for this seller (stored in custom fields).</Trans>
            </p>
            <Select
                value={collectionId || '__none__'}
                onValueChange={v => {
                    form.setValue('customFields.collectionId', v === '__none__' ? undefined : v, {
                        shouldDirty: true,
                    });
                }}
            >
                <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder={t`Select collection`} >
                        {collections.find(c => c.id === collectionId)?.name}
                    </SelectValue>
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
    );
}

import { api, BulkActionComponent, DataTableBulkActionItem, usePaginatedList } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { CheckCheck } from 'lucide-react';

import { acceptMultiplePreOrdersDocument } from './documents';

export const AcceptPreOrdersBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
    const { refetchPaginatedList } = usePaginatedList();
    return (
        <DataTableBulkActionItem
            requiresPermission={['UpdatePreOrder']}
            label={<Trans>Accept</Trans>}
            confirmationText={<Trans>Accept selected pre-orders?</Trans>}
            icon={CheckCheck}
            onClick={async () => {
                const ids = selection.map((s: { id: string }) => s.id);
                await api.mutate(acceptMultiplePreOrdersDocument, { ids });
                await refetchPaginatedList();
                table.resetRowSelection();
            }}
        />
    );
};

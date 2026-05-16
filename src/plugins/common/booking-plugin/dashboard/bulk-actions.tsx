import { api, BulkActionComponent, DataTableBulkActionItem, usePaginatedList } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { Trash2 } from 'lucide-react';

import { deleteBookingsDocument } from './documents';

export const DeleteBookingsBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
    const { refetchPaginatedList } = usePaginatedList();
    return (
        <DataTableBulkActionItem
            requiresPermission={['DeleteBooking']}
            label={<Trans>Delete</Trans>}
            confirmationText={<Trans>Delete selected services?</Trans>}
            icon={Trash2}
            className="text-destructive"
            onClick={async () => {
                const ids = selection.map((s: { id: string }) => s.id);
                await api.mutate(deleteBookingsDocument, { ids });
                await refetchPaginatedList();
                table.resetRowSelection();
            }}
        />
    );
};

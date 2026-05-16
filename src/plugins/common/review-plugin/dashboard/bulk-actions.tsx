import { api, BulkActionComponent, DataTableBulkActionItem, usePaginatedList } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { Trash2 } from 'lucide-react';

import { deleteReviewsDocument } from './documents';

export const DeleteReviewsBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
    const { refetchPaginatedList } = usePaginatedList();
    return (
        <DataTableBulkActionItem
            requiresPermission={['DeleteReview']}
            label={<Trans>Delete</Trans>}
            confirmationText={<Trans>Delete selected reviews?</Trans>}
            icon={Trash2}
            className="text-destructive"
            onClick={async () => {
                const ids = selection.map(s => s.id);
                await api.mutate(deleteReviewsDocument, { ids });
                await refetchPaginatedList();
                table.resetRowSelection();
            }}
        />
    );
};

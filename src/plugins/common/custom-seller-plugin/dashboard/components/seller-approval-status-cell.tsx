import { api, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, usePaginatedList, usePermissions } from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { CellContext } from '@tanstack/react-table';
import { toast } from 'sonner';

import { approveSellerDocument, rejectSellerDocument } from '../documents';

type Row = { id: string; customFields?: { status?: string | null } | null };

export function SellerApprovalStatusCell({ value, row }: CellContext<Row, unknown> & { value?: unknown }) {
    const { hasPermissions } = usePermissions();
    const { refetchPaginatedList } = usePaginatedList();
    const { t } = useLingui();
    const canChange = hasPermissions(['SuperAdmin']);
    const seller = row.original;
    const status = (value as string | undefined) ?? seller?.customFields?.status ?? 'Pending';

    const approveMutation = useMutation({
        mutationFn: () => api.mutate(approveSellerDocument, { sellerId: seller.id }),
        onSuccess: () => {
            toast.success(t`Seller approved`);
            void refetchPaginatedList();
        },
        onError: () => toast.error(t`Failed to approve seller`),
    });

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => api.mutate(rejectSellerDocument, { sellerId: seller.id, reason }),
        onSuccess: () => {
            toast.success(t`Seller rejected`);
            void refetchPaginatedList();
        },
        onError: () => toast.error(t`Failed to reject seller`),
    });

    if (!canChange) {
        return <span className="text-muted-foreground text-sm">{status}</span>;
    }

    return (
        <Select
            value={status}
            onValueChange={next => {
                if (next === status) {
                    return;
                }
                if (next === 'Approved') {
                    approveMutation.mutate();
                } else if (next === 'Disapproved') {
                    const reason = window.prompt(t`Enter reason for disapproval:`);
                    if (reason?.trim()) {
                        rejectMutation.mutate(reason.trim());
                    }
                }
            }}
        >
            <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Pending"><Trans>Pending</Trans></SelectItem>
                <SelectItem value="Approved"><Trans>Approved</Trans></SelectItem>
                <SelectItem value="Disapproved"><Trans>Disapproved</Trans></SelectItem>
            </SelectContent>
        </Select>
    );
}

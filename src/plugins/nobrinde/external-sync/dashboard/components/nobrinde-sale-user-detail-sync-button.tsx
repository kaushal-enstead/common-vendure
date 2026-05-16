import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runNobrindeSaleUserSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface NobrindeSaleUserDetailSyncButtonProps {
  entityId?: string | null;
}

export function NobrindeSaleUserDetailSyncButton({ entityId }: NobrindeSaleUserDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const saleUserId = entityId;

  const { mutate: runSync, isPending } = useMutation({
    mutationFn: (saleUserIds: string[]) => api.mutate(runNobrindeSaleUserSyncDocument, { saleUserIds }),
    onSuccess: data => {
      const success = data?.runNobrindeSaleUserSync === true;
      if (success) {
        toast.success('Sales user synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Sales user sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Sales user sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !saleUserId}
      confirmMessage="Sync this sales user from the external database? Local changes may be overwritten."
      onConfirmed={() => saleUserId && runSync([saleUserId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync sales user from external'}
    </ConfirmedSyncButton>
  );
}

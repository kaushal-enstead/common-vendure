import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runNobrindeOrderSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface NobrindeOrderDetailSyncButtonProps {
  entityId?: string | null;
}

export function NobrindeOrderDetailSyncButton({ entityId }: NobrindeOrderDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const orderId = entityId;

  const { mutate: runSync, isPending } = useMutation({
    mutationFn: (orderIds: string[]) => api.mutate(runNobrindeOrderSyncDocument, { orderIds }),
    onSuccess: data => {
      const success = data?.runNobrindeOrderSync === true;
      if (success) {
        toast.success('Nobrinde order synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Order sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Order sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !orderId}
      confirmMessage="Sync this Nobrinde order from the external database? Local changes may be overwritten."
      onConfirmed={() => orderId && runSync([orderId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync order from external'}
    </ConfirmedSyncButton>
  );
}

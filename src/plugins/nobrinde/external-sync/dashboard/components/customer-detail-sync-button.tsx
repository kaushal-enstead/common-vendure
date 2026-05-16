import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runCustomerSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface CustomerDetailSyncButtonProps {
  context: {
    entity?: { id?: string; customFields?: { mappingId?: number | null } };
    route?: unknown;
  };
}

export function CustomerDetailSyncButton({ context }: CustomerDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const customerId = context.entity?.id;
  const mappingId = context.entity?.customFields?.mappingId;
  const canSync = Boolean(customerId && mappingId != null && !Number.isNaN(Number(mappingId)));

  const { mutate: runCustomerSync, isPending } = useMutation({
    mutationFn: (customerIds: string[]) => api.mutate(runCustomerSyncDocument, { customerIds }),
    onSuccess: data => {
      const success = data?.runCustomerSync === true;
      if (success) {
        toast.success('Customer synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Customer sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Customer sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !canSync}
      confirmMessage="Sync this customer from the external database? Local changes may be overwritten."
      onConfirmed={() => customerId && runCustomerSync([customerId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync customer from external'}
    </ConfirmedSyncButton>
  );
}

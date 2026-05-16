import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runVariantSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface ProductVariantDetailSyncButtonProps {
  context: { entity?: { id: string }; route?: unknown };
}

export function ProductVariantDetailSyncButton({ context }: ProductVariantDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const variantId = context.entity?.id;

  const { mutate: runVariantSync, isPending } = useMutation({
    mutationFn: (variantIds: string[]) => api.mutate(runVariantSyncDocument, { variantIds }),
    onSuccess: data => {
      const success = data?.runVariantSync === true;
      if (success) {
        toast.success('Variant synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Variant sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Variant sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !variantId}
      confirmMessage="Sync this product variant from the external database? Local changes may be overwritten."
      onConfirmed={() => variantId && runVariantSync([variantId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync variant from external'}
    </ConfirmedSyncButton>
  );
}

import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runProductSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface ProductDetailSyncButtonProps {
  context: { entity?: { id: string }; route?: unknown };
}

export function ProductDetailSyncButton({ context }: ProductDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const productId = context.entity?.id;

  const { mutate: runProductSync, isPending } = useMutation({
    mutationFn: (productIds: string[]) => api.mutate(runProductSyncDocument, { productIds }),
    onSuccess: (data, productIds) => {
      const success = data?.runProductSync === true;
      if (success) {
        toast.success('Product synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Product sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Product sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !productId}
      confirmMessage="Sync this product from the external database? Local changes may be overwritten."
      onConfirmed={() => productId && runProductSync([productId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync from external'}
    </ConfirmedSyncButton>
  );
}

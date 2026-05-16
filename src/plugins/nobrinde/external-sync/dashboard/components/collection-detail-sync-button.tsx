import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runCollectionSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface CollectionDetailSyncButtonProps {
  context: { entity?: { id: string }; route?: unknown };
}

export function CollectionDetailSyncButton({ context }: CollectionDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const collectionId = context.entity?.id;

  const { mutate: runCollectionSync, isPending } = useMutation({
    mutationFn: (collectionIds: string[]) => api.mutate(runCollectionSyncDocument, { collectionIds }),
    onSuccess: data => {
      const success = data?.runCollectionSync === true;
      if (success) {
        toast.success('Collection synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Collection sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Collection sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !collectionId}
      confirmMessage="Sync this collection from the external database? Local changes may be overwritten."
      onConfirmed={() => collectionId && runCollectionSync([collectionId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync collection from external'}
    </ConfirmedSyncButton>
  );
}

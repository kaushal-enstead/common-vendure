import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runFacetSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface FacetDetailSyncButtonProps {
  context: { entity?: { id: string }; route?: unknown };
}

export function FacetDetailSyncButton({ context }: FacetDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const facetId = context.entity?.id;

  const { mutate: runFacetSync, isPending } = useMutation({
    mutationFn: (facetIds: string[]) => api.mutate(runFacetSyncDocument, { facetIds }),
    onSuccess: data => {
      const success = data?.runFacetSync === true;
      if (success) {
        toast.success('Facet synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Facet sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Facet sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !facetId}
      confirmMessage="Sync this facet from the external database? Local changes may be overwritten."
      onConfirmed={() => facetId && runFacetSync([facetId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync facet from external'}
    </ConfirmedSyncButton>
  );
}

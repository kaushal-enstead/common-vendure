import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runNobrindeChannelSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface NobrindeChannelDetailSyncButtonProps {
  entityId?: string | null;
}

export function NobrindeChannelDetailSyncButton({ entityId }: NobrindeChannelDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const channelId = entityId;

  const { mutate: runSync, isPending } = useMutation({
    mutationFn: (channelIds: string[]) => api.mutate(runNobrindeChannelSyncDocument, { channelIds }),
    onSuccess: data => {
      const success = data?.runNobrindeChannelSync === true;
      if (success) {
        toast.success('Nobrinde channel synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Channel sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Channel sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !channelId}
      confirmMessage="Sync this Nobrinde channel from the external database? Local changes may be overwritten."
      onConfirmed={() => channelId && runSync([channelId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync channel from external'}
    </ConfirmedSyncButton>
  );
}

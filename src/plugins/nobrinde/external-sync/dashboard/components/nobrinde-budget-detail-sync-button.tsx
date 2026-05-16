import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import { RefreshCw } from 'lucide-react';
import { ConfirmedSyncButton } from './confirmed-sync-button';
import { runNobrindeBudgetSyncDocument } from '../routes/sync-control/sync-control.graphql';

interface NobrindeBudgetDetailSyncButtonProps {
  entityId?: string | null;
}

export function NobrindeBudgetDetailSyncButton({ entityId }: NobrindeBudgetDetailSyncButtonProps) {
  const queryClient = useQueryClient();
  const budgetId = entityId;

  const { mutate: runSync, isPending } = useMutation({
    mutationFn: (budgetIds: string[]) => api.mutate(runNobrindeBudgetSyncDocument, { budgetIds }),
    onSuccess: data => {
      const success = data?.runNobrindeBudgetSync === true;
      if (success) {
        toast.success('Budget synced from external');
        queryClient.invalidateQueries();
      } else {
        toast.error('Budget sync failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Budget sync failed');
    },
  });

  return (
    <ConfirmedSyncButton
      variant="secondary"
      disabled={isPending || !budgetId}
      confirmMessage="Sync this budget from the external database? Local changes may be overwritten."
      onConfirmed={() => budgetId && runSync([budgetId])}
    >
      {!isPending && <RefreshCw className="mr-2 h-4 w-4" />}
      {isPending ? 'Syncing…' : 'Sync budget from external'}
    </ConfirmedSyncButton>
  );
}

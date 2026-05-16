import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import {
  Button,
  DashboardRouteDefinition,
  detailPageRouteLoader,
  Input,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  useDetailPage,
} from '@vendure/dashboard';
import { syncTableDetailDocument, updateSyncTableDocument } from './sync-control.graphql';

const pageId = 'sync-control-detail';

function formatDateTimeLocal(d: Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function parseDateTimeLocal(s: string): Date | null {
  if (!s?.trim()) return null;
  const n = Date.parse(s);
  return Number.isNaN(n) ? null : new Date(n);
}

export const syncControlDetail: DashboardRouteDefinition = {
  path: '/settings/sync-control/$id',
  loader: detailPageRouteLoader({
    queryDocument: syncTableDetailDocument,
    breadcrumb: (isNew, entity) => [
      { path: '/settings/sync-control', label: 'Sync Control' },
      entity?.tableName ?? '',
    ],
  }),
  component: route => {
    const params = route.useParams();
    const { entity } = useDetailPage({
      queryDocument: syncTableDetailDocument,
      pageId,
      setValuesForUpdate: () => ({}),
      params: { id: params.id },
    });
    const queryClient = useQueryClient();
    const [lastSyncedAtValue, setLastSyncedAtValue] = useState<string>('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
      if (entity?.lastSyncedAt != null || entity?.lastSyncedAt === null) {
        setLastSyncedAtValue(formatDateTimeLocal(entity.lastSyncedAt as unknown as Date));
      }
    }, [entity?.lastSyncedAt]);

    const { mutate: updateSyncTable, isPending } = useMutation({
      mutationFn: (input: { id: string; lastSyncedAt: string | null }) => {
        const lastSyncedAt = input.lastSyncedAt?.trim() ? parseDateTimeLocal(input.lastSyncedAt) : null;
        return api.mutate(updateSyncTableDocument, {
          input: { id: input.id, lastSyncedAt },
        });
      },
      onSuccess: () => {
        toast.success('Last synced at updated');
        setHasChanges(false);
        void queryClient.invalidateQueries({ queryKey: ['detail', pageId, params.id] });
      },
      onError: (err: Error) => {
        toast.error(err.message ?? 'Failed to update');
      },
    });

    if (!entity) {
      return null;
    }

    const currentFormatted = formatDateTimeLocal(entity.lastSyncedAt as unknown as Date);
    const isDirty = hasChanges && lastSyncedAtValue !== currentFormatted;

    const handleLastSyncedAtChange = (value: string) => {
      setLastSyncedAtValue(value);
      setHasChanges(true);
    };

    const handleSave = () => {
      const newDate = lastSyncedAtValue.trim() ? lastSyncedAtValue : null;
      updateSyncTable({
        id: entity.id,
        lastSyncedAt: newDate,
      });
    };

    const handleClear = () => {
      setLastSyncedAtValue('');
      setHasChanges(true);
    };

    return (
      <Page pageId={pageId}>
        <PageTitle>
          <Trans>Sync Control</Trans>: {entity.tableName}
        </PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button">
            <Button variant="outline" onClick={handleClear} disabled={!lastSyncedAtValue}>
              <Trans>Clear date</Trans>
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isPending}>
              {isPending ? 'Saving…' : 'Save last synced at'}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="main" blockId="sync-control-detail" title={<Trans>Sync table</Trans>}>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Table name</dt>
                <dd>{entity.tableName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">ID</dt>
                <dd>{entity.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Created at</dt>
                <dd>{entity.createdAt ? new Date(entity.createdAt).toLocaleString() : '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Updated at</dt>
                <dd>{entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '–'}</dd>
              </div>
            </dl>
          </PageBlock>
          <PageBlock column="main" blockId="sync-control-edit" title={<Trans>Last synced at</Trans>}>
            <p className="text-muted-foreground text-sm mb-2">
              <Trans>Set to clear (empty) to trigger a full sync on next run.</Trans>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="datetime-local"
                value={lastSyncedAtValue}
                onChange={e => handleLastSyncedAtChange(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trans>Clear</Trans>
              </Button>
            </div>
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

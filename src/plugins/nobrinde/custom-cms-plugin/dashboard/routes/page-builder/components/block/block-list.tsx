import { Button, useMutation, useQuery, toast } from '@vendure/dashboard';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Trans, useLingui } from '@lingui/react/macro';
import { api } from '@vendure/dashboard';
import { reorderPageBlocksDocument, pageBlocksDocument, createPageBlockDocument } from '../../page.graphql';
import { BlockListItem } from './block-item';

interface BlockListProps {
  pageId: string;
  onRefresh: () => void;
}

export function BlockList({ pageId, onRefresh }: BlockListProps) {
  const { t } = useLingui();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const {
    data: blocksData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['pageBlocks', pageId],
    queryFn: () => api.query(pageBlocksDocument, { pageId }),
    enabled: !!pageId,
  });

  const blocks = blocksData?.pageBlocks || [];

  const reorderMutation = useMutation({
    mutationFn: api.mutate(reorderPageBlocksDocument),
    onSuccess: () => {
      toast.success(t`Blocks reordered successfully`);
      refetch();
      onRefresh();
    },
    onError: (err: any) => {
      toast.error(t`Failed to reorder blocks`, { description: err.message });
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: api.mutate(createPageBlockDocument),
    onSuccess: () => {
      toast.success(t`Block created successfully`);
      refetch();
      onRefresh();
    },
    onError: (err: any) => {
      toast.error(t`Failed to create block`, { description: err.message });
    },
  });

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = blocks.findIndex(b => b.id === active.id);
    const to = blocks.findIndex(b => b.id === over.id);
    if (from !== -1 && to !== -1 && from !== to) {
      const newOrder = [...blocks];
      const [moved] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, moved);
      const blockIds = newOrder.map(b => b.id);
      reorderMutation.mutate({ blockIds });
    }
  }

  const handleAddBlock = () => {
    if (!pageId) {
      toast.error(t`Please save the page first before adding blocks`);
      return;
    }

    createBlockMutation.mutate({
      input: {
        pageId,
        code: `New-block-${Date.now()}`,
        index: blocks.length,
        active: true,
        css: {},
      },
    });
  };

  if (!pageId) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-md">
        <p className="mb-2">
          <Trans>Please save the page first to add blocks</Trans>
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Trans>Loading blocks...</Trans>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          <Trans>No blocks yet. Add your first block to start building the page.</Trans>
        </div>
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={handleAddBlock}>
            <Trans>Add Block</Trans>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddBlock}
          disabled={createBlockMutation.isPending}
        >
          <Trans>Add Block</Trans>
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {blocks.map(block => (
              <BlockListItem
                key={block.id}
                block={block}
                onRefresh={() => {
                  refetch();
                  onRefresh();
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

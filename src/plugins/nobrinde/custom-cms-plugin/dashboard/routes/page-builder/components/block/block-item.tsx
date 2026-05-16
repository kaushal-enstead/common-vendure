import { useState } from 'react';
import { Button, Card, Badge, Input, Switch, useMutation, toast } from '@vendure/dashboard';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, Eye, Edit2, Check, X, WandSparkles, Pencil } from 'lucide-react';
import { Trans, useLingui } from '@lingui/react/macro';
import { api } from '@vendure/dashboard';
import { BlockContentModal } from './block-content-modal';
import {
  updatePageBlockDocument,
  deletePageBlockDocument,
  duplicatePageBlockDocument,
} from '../../page.graphql';
import { CssEditorModal } from '../../../../shared/css-editor-modal';

interface BlockListItemProps {
  block: any;
  onRefresh: () => void;
}

export function BlockListItem({ block, onRefresh }: BlockListItemProps) {
  const { t } = useLingui();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const [cssModalOpen, setCssModalOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeValue, setCodeValue] = useState(block.code || '');

  const updateBlockMutation = useMutation({
    mutationFn: api.mutate(updatePageBlockDocument),
    onSuccess: () => {
      toast.success(t`Block updated successfully`);
      onRefresh();
    },
    onError: (err: any) => {
      toast.error(t`Failed to update block`, { description: err.message });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: api.mutate(deletePageBlockDocument),
    onSuccess: () => {
      toast.success(t`Block deleted successfully`);
      onRefresh();
    },
    onError: (err: any) => {
      toast.error(t`Failed to delete block`, { description: err.message });
    },
  });

  const duplicateBlockMutation = useMutation({
    mutationFn: api.mutate(duplicatePageBlockDocument),
    onSuccess: () => {
      toast.success(t`Block duplicated successfully`);
      onRefresh();
    },
    onError: (err: any) => {
      toast.error(t`Failed to duplicate block`, { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: api.mutate(updatePageBlockDocument),
    onSuccess: () => {
      onRefresh();
    },
  });

  const handleToggleActive = (checked: boolean) => {
    toggleActiveMutation.mutate({
      input: {
        id: block.id,
        active: checked,
      },
    });
  };

  const handleDelete = () => {
    if (confirm(t`Are you sure you want to delete this block?`)) {
      deleteBlockMutation.mutate({ id: block.id });
    }
  };

  const handleDuplicate = () => {
    if (confirm(t`Are you sure you want to duplicate this block?`)) {
      duplicateBlockMutation.mutate({ id: block.id });
    }
  };

  const handleCodeSave = () => {
    updateBlockMutation.mutate({
      input: {
        id: block.id,
        code: codeValue || null,
      },
    });
    setIsEditingCode(false);
  };

  const handleCodeCancel = () => {
    setCodeValue(block.code || '');
    setIsEditingCode(false);
  };

  const handleCssSave = (css: Record<string, any>) => {
    updateBlockMutation.mutate({
      input: { id: block.id, css },
    });
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-0 overflow-hidden ${isDragging ? 'opacity-80 shadow-lg' : 'shadow-sm'}`}
      >
        <div className="p-3 border-b bg-background/95 space-y-2">
          {/* First Row: Drag handle, Index, and Active tag */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="opacity-70 size-4" />
              <Badge variant="secondary" className="text-sm font-medium">
                <Trans># {block.index + 1}</Trans>
              </Badge>
            </button>
            <Switch
              checked={block.active}
              onCheckedChange={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
              className="mr-2"
            />
          </div>

          {/* Second Row: Name/Code */}
          <div className="flex items-center gap-2 py-1">
            {isEditingCode ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={codeValue}
                  onChange={e => setCodeValue(e.target.value)}
                  placeholder="block-code"
                  className="h-7 text-sm flex-1"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleCodeSave();
                    } else if (e.key === 'Escape') {
                      handleCodeCancel();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCodeSave}
                  disabled={updateBlockMutation.isPending}
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCodeCancel}
                  disabled={updateBlockMutation.isPending}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                {block.code ? (
                  <div
                    className="flex items-center gap-1"
                    onClick={e => {
                      e.stopPropagation();
                      setIsEditingCode(true);
                    }}
                  >
                    <span
                      className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Click to edit code"
                    >
                      {block.code}
                    </span>
                    <Pencil className="size-3.5" />
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5"
                    onClick={e => {
                      e.stopPropagation();
                      setIsEditingCode(true);
                    }}
                    title="Add code"
                  >
                    <Edit2 className="size-3.5" />
                    <span className="text-xs text-muted-foreground">
                      <Trans>Add name</Trans>
                    </span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Third Row: Actions */}
          <div className="flex items-center border-t pt-1 justify-between gap-1">
            <Badge variant={block.active ? 'default' : 'secondary'}>
              {block.active ? <Trans>Active</Trans> : <Trans>Inactive</Trans>}
            </Badge>
            <div>
              <Button
                variant="ghost"
                size="icon"
                title="View/Edit Content"
                onClick={() => setContentModalOpen(true)}
              >
                <Eye className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Edit CSS" onClick={() => setCssModalOpen(true)}>
                <WandSparkles className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Duplicate"
                onClick={handleDuplicate}
                disabled={duplicateBlockMutation.isPending}
              >
                <Copy className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={handleDelete}
                disabled={deleteBlockMutation.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <CssEditorModal
        open={cssModalOpen}
        onClose={() => setCssModalOpen(false)}
        value={block.css || {}}
        onChange={handleCssSave}
        title={<Trans>Edit Block CSS</Trans>}
        jsonMode={true}
      />

      <BlockContentModal
        open={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        blockId={block.id}
        onRefresh={onRefresh}
      />
    </>
  );
}

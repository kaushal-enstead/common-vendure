import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormFieldWrapper,
  Input,
  useFieldArray,
  useFormContext,
} from '@vendure/dashboard';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, ChevronUp, ChevronDown, Copy, FileText } from 'lucide-react';
import { Trans } from '@lingui/react/macro';
import { AssetFieldWithPicker } from '../../../shared/asset-field-with-picker.js';

/** Item header (uses listeners/attributes from useSortable in parent) */
function ItemHeader({
  index,
  collapsed,
  onToggle,
  onDuplicate,
  onRemove,
  dragAttributes,
  dragListeners,
}: {
  index: number;
  collapsed: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  dragAttributes: any;
  dragListeners: any;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3 border-b bg-background/95">
      <button
        type="button"
        {...dragAttributes}
        {...dragListeners}
        className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="opacity-70 size-4" />
        <span className="text-sm font-medium">Item #{index + 1}</span>
      </button>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" title="Collapse/Expand" onClick={onToggle}>
          {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" title="Duplicate" onClick={onDuplicate}>
          <Copy className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Delete" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/** Sortable Document item */
function SortableDocumentItem({
  sortableId,
  formName,
  index,
  remove,
  duplicate,
}: {
  sortableId: string;
  formName: string;
  index: number;
  remove: (i: number) => void;
  duplicate: (i: number) => void;
}) {
  const { control } = useFormContext();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [collapsed, setCollapsed] = useState(true);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-0 overflow-hidden bg-background/30 shadow-sm ${isDragging ? 'opacity-80' : ''}`}
    >
      <ItemHeader
        index={index}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        onDuplicate={() => duplicate(index)}
        onRemove={() => remove(index)}
        dragAttributes={attributes}
        dragListeners={listeners}
      />

      {!collapsed && (
        <CardContent className="p-3 md:p-4 flex flex-col gap-3 space-y-3">
          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.name`}
            label={<Trans>Name</Trans>}
            render={({ field }) => (
              <Input {...field} value={field.value as string} placeholder="Enter document name..." />
            )}
          />

          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.assetId`}
            label={<Trans>Document Asset</Trans>}
            render={() => (
              <AssetFieldWithPicker
                name={`${formName}.${index}.assetId`}
                placeholder="Asset ID or URL"
                emptyIcon={<FileText className="size-6 text-muted-foreground" />}
                dialogTitle="Select Document Asset"
              />
            )}
          />
        </CardContent>
      )}
    </Card>
  );
}

/** Main Document items builder with drag & drop */
export function DocumentItemsBuilder({ name }: { name: string }) {
  const form = useFormContext();
  const { fields, append, remove: removeItem, insert, move } = useFieldArray({ control: form.control, name });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Update indices for all items
  const updateIndices = () => {
    const currentValues = form.getValues(name) || [];
    currentValues.forEach((item, idx) => {
      if (item?.index !== idx) {
        form.setValue(`${name}.${idx}.index`, idx, { shouldDirty: true });
      }
    });
  };

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = fields.findIndex(f => f.id === active.id);
    const to = fields.findIndex(f => f.id === over.id);
    if (from !== -1 && to !== -1 && from !== to) {
      move(from, to);
      // Update indices after move
      setTimeout(() => updateIndices(), 0);
    }
  }

  function remove(index: number) {
    removeItem(index);
    // Update indices after removal
    setTimeout(() => updateIndices(), 0);
  }

  function duplicate(index: number) {
    const value = form.getValues(`${name}.${index}` as const);
    const currentValues = form.getValues(name) || [];
    const next = {
      ...value,
      index: currentValues.length, // Will be updated by updateIndices
    };
    insert(index + 1, next);
    // Update indices after duplicate
    setTimeout(() => updateIndices(), 0);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {fields.length === 0 && (
            <div className="text-sm text-muted-foreground border rounded-md p-3">
              <Trans>
                No document items. Click on <b>Add Item</b> to start.
              </Trans>
            </div>
          )}

          {fields.map((f, i) => (
            <SortableDocumentItem
              key={f.id}
              sortableId={f.id}
              formName={name}
              index={i}
              remove={remove}
              duplicate={duplicate}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="pt-1">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const currentValues = form.getValues(name as any) || [];
            append({
              name: '',
              assetId: '',
              index: currentValues.length,
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> <Trans>Add Item</Trans>
        </Button>
      </div>
    </div>
  );
}

import { Button, Input, useFieldArray, useWatch, useFormContext } from '@vendure/dashboard';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, Plus, Trash2, WandSparkles } from 'lucide-react';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { ColumnEditorStandalone } from './column-editor-standalone';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CssEditorModal } from '../../../../shared/css-editor-modal';

export function ColumnsBuilder({ name }: { name: string }) {
  const form = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleAddColumn = () => {
    const currentColumns = form.getValues(name) || [];
    const newWidth = 100 / (currentColumns.length + 1);

    // Adjust existing columns
    currentColumns.forEach((col, index: number) => {
      form.setValue(`${name}.${index}.css.width`, newWidth);
    });

    // Add new column
    append({ type: '', css: { width: newWidth }, data: {} });
  };

  const handleDeleteColumn = (index: number) => {
    const currentColumns = form.getValues(name) || [];
    remove(index);

    // Auto-adjust widths for remaining columns
    if (currentColumns.length > 1) {
      const newWidth = 100 / (currentColumns.length - 1);
      const remainingColumns = form.getValues(name) || [];
      remainingColumns.forEach((_, i: number) => {
        form.setValue(`${name}.${i}.css.width`, newWidth);
      });
    }
  };

  const handleWidthChange = (columnIndex: number, newWidth: number) => {
    form.setValue(`${name}.${columnIndex}.css.width`, newWidth);

    const currentColumns = form.getValues(name) || [];
    const remainingWidth = 100 - newWidth;
    const otherIndices = currentColumns.map((_, i) => i).filter(i => i !== columnIndex);

    // Distribute remaining width among other columns
    if (otherIndices.length > 0) {
      const widthPerOther = remainingWidth / otherIndices.length;
      otherIndices.forEach(i => {
        form.setValue(`${name}.${i}.css.width`, widthPerOther);
      });
    }
  };

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = fields.findIndex(f => f.id === active.id);
    const to = fields.findIndex(f => f.id === over.id);
    if (from !== -1 && to !== -1 && from !== to) {
      move(from, to);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={handleAddColumn}>
          <Plus className="mr-2 h-4 w-4" />
          <Trans>Add Column</Trans>
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {fields.map((fieldItem, columnIndex) => (
              <SortableColumnItem
                key={fieldItem.id}
                sortableId={fieldItem.id}
                columnIndex={columnIndex}
                columnsFieldName={name}
                onDelete={() => handleDeleteColumn(columnIndex)}
                onWidthChange={handleWidthChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Trans>No columns yet. Add your first column.</Trans>
        </div>
      )}
    </div>
  );
}

function SortableColumnItem({
  sortableId,
  columnIndex,
  columnsFieldName,
  onDelete,
  onWidthChange,
}: {
  sortableId: string;
  columnIndex: number;
  columnsFieldName: string;
  onDelete: () => void;
  onWidthChange: (columnIndex: number, width: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const { control, setValue } = useFormContext();
  const columnWidth = useWatch({ control, name: `${columnsFieldName}.${columnIndex}.css.width` }) || 0;
  const columnCss = useWatch({ control, name: `${columnsFieldName}.${columnIndex}.css` }) || {};
  const [cssModalOpen, setCssModalOpen] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`border rounded-md p-4 bg-sidebar ${isDragging ? 'opacity-80' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="size-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium">
              <Trans>Column {columnIndex + 1}</Trans>
            </span>
            <div className="flex items-center gap-2 ml-2">
              <label className="text-xs text-muted-foreground">
                <Trans>Width</Trans>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={columnWidth}
                onChange={e => {
                  const width = parseFloat(e.target.value) || 0;
                  onWidthChange(columnIndex, Math.min(100, Math.max(0, width)));
                }}
                className="w-20 h-6 text-xs"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button title="Edit CSS" variant="ghost" size="sm" onClick={() => setCssModalOpen(true)}>
              <WandSparkles className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={onDelete}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <ColumnEditorStandalone columnIndex={columnIndex} columnsFieldName={columnsFieldName} />
      </div>

      <CssEditorModal
        open={cssModalOpen}
        onClose={() => setCssModalOpen(false)}
        value={columnCss}
        onChange={css => {
          setValue(`${columnsFieldName}.${columnIndex}.css`, css, { shouldDirty: true });
        }}
        title={<Trans>Edit Column CSS - Column {columnIndex + 1}</Trans>}
        defaultFields={[
          { key: 'backgroundColor', label: 'Background Color', placeholder: '#ffffff' },
          { key: 'color', label: 'Text Color', placeholder: '#000000' },
        ]}
        jsonMode={true}
      />
    </>
  );
}

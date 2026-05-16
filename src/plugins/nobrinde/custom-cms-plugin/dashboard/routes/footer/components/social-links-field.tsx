import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormFieldWrapper,
  Switch,
  useFieldArray,
  useFormContext,
} from '@vendure/dashboard';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { Input } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { AssetFieldWithPicker } from '../../../shared/asset-field-with-picker.js';

/** Item header */
function ItemHeader({
  index,
  collapsed,
  onToggle,
  onDuplicate,
  onRemove,
  dragAttributes,
  dragListeners,
  active,
  onActiveChange,
}: {
  index: number;
  collapsed: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  dragAttributes: any;
  dragListeners: any;
  active: boolean;
  onActiveChange: (value: boolean) => void;
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
        <span className="text-sm font-medium">Social Link #{index + 1}</span>
      </button>

      <div className="flex items-center gap-2">
        <Switch checked={active ?? true} onCheckedChange={onActiveChange} />
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

/** Sortable Social Link Item */
function SortableSocialLinkItem({
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
  const { control, watch, setValue } = useFormContext();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [collapsed, setCollapsed] = useState(true);
  const active = watch(`${formName}.${index}.active`);

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
        active={active ?? true}
        onActiveChange={value => setValue(`${formName}.${index}.active`, value, { shouldDirty: true })}
      />

      {!collapsed && (
        <CardContent className="p-3 md:p-4 flex flex-col gap-3 space-y-3">
          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.label`}
            label={<Trans>Label</Trans>}
            render={({ field }) => (
              <Input {...field} value={field.value as string} placeholder="Enter label..." />
            )}
          />

          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.image`}
            label={<Trans>Image</Trans>}
            render={() => (
              <AssetFieldWithPicker
                name={`${formName}.${index}.image`}
                placeholder="Asset ID or URL"
                dialogTitle="Select Asset"
              />
            )}
          />

          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.url`}
            label={<Trans>URL</Trans>}
            render={({ field }) => (
              <Input {...field} value={field.value as string} placeholder="https://example.com" type="url" />
            )}
          />
        </CardContent>
      )}
    </Card>
  );
}

/** Social Links Field */
export function SocialLinksField({ name }: { name: string }) {
  const form = useFormContext();
  const {
    fields,
    append,
    remove: removeItem,
    insert,
    move,
  } = useFieldArray({
    control: form.control,
    name,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = fields.findIndex(f => f.id === active.id);
    const to = fields.findIndex(f => f.id === over.id);
    if (from !== -1 && to !== -1 && from !== to) {
      move(from, to);
    }
  }

  function remove(index: number) {
    removeItem(index);
  }

  function duplicate(index: number) {
    const value = form.getValues(`${name}.${index}` as const);
    const next = {
      ...value,
    };
    insert(index + 1, next);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {fields.length === 0 && (
            <div className="text-sm text-muted-foreground border rounded-md p-3">
              <Trans>
                No social links. Click on <b>Add Link</b> to start.
              </Trans>
            </div>
          )}

          {fields.map((f, i) => (
            <SortableSocialLinkItem
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
          onClick={() =>
            append({
              label: '',
              image: '',
              url: '',
              active: true,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> <Trans>Add Link</Trans>
        </Button>
      </div>
    </div>
  );
}

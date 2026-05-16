import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormFieldWrapper,
  Switch,
  Control,
  useFieldArray,
  useFormContext,
} from '@vendure/dashboard';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, ChevronUp, ChevronDown, Copy, ChevronRight, Link2 } from 'lucide-react';
import { Input } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { NavLinkChildrenBuilder } from './nav-link-children-builder.jsx';
import { AlertButtonField } from '../../alert/components/alert-button-field.jsx';

/** Item header */
function ItemHeader({
  index,
  collapsed,
  label = '',
  fieldId,
  onToggle,
  onDuplicate,
  onRemove,
  dragAttributes,
  dragListeners,
  hasChildren,
  control,
}: {
  index: number;
  collapsed: boolean;
  fieldId: string;
  onToggle: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  dragAttributes: any;
  label: string;
  dragListeners: any;
  hasChildren: boolean;
  control: Control<any>;
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
        <span className="text-sm font-medium">
          {label} #{index + 1}
        </span>
        {hasChildren && <ChevronRight className="size-3 opacity-60" />}
      </button>

      <div className="flex items-center gap-2">
        <FormFieldWrapper
          control={control}
          name={fieldId}
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
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

/** Sortable Nav Link Item */
function SortableNavLinkItem({
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
  const [collapsed, setCollapsed] = useState(true);
  const children = watch(`${formName}.${index}.children`) || [];
  const hasChildren = Array.isArray(children) && children.length > 0;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-0 overflow-hidden bg-background/30 shadow-sm ${isDragging ? 'opacity-80' : ''}`}
    >
      <ItemHeader
        control={control}
        index={index}
        collapsed={collapsed}
        fieldId={`${formName}.${index}.active`}
        label={watch(`${formName}.${index}.label`) || 'Nav Link'}
        onToggle={() => setCollapsed(v => !v)}
        onDuplicate={() => duplicate(index)}
        onRemove={() => remove(index)}
        dragAttributes={attributes}
        dragListeners={listeners}
        hasChildren={hasChildren}
      />

      {!collapsed && (
        <CardContent className="p-3 md:p-4 flex flex-col gap-3">
          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.label`}
            label={<Trans>Label</Trans>}
            render={({ field }) => (
              <Input {...field} value={field.value as string} placeholder="Enter label..." />
            )}
          />

          {hasChildren ? (
            // Show children section when children exist
            <div className="border-t border-dashed pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">
                  <Trans>Child Links</Trans>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Clear children and switch to parent link mode
                    setValue(`${formName}.${index}.children`, [], { shouldDirty: true });
                  }}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  <Trans>Use as Parent Link Instead</Trans>
                </Button>
              </div>
              <NavLinkChildrenBuilder name={`${formName}.${index}.children`} />
            </div>
          ) : (
            // Show parent link when no children
            <div className="border-t border-dashed pt-4">
              <div className="text-sm font-semibold mb-3">
                <Trans>Link</Trans>
              </div>
              <AlertButtonField name={`${formName}.${index}.link`} />
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add first child and switch to children mode
                    setValue(`${formName}.${index}.link`, undefined, { shouldDirty: true });
                    setValue(
                      `${formName}.${index}.children`,
                      [
                        {
                          label: '',
                          type: 'external',
                          openInNewTab: false,
                          url: '',
                          active: true,
                        },
                      ],
                      { shouldDirty: true },
                    );
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <Trans>Add Children Instead</Trans>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/** Main Nav Links builder with drag & drop */
export function NavLinksBuilder({ name }: { name: string }) {
  const form = useFormContext();
  const { fields, append, remove: removeItem, insert, move } = useFieldArray({ control: form.control, name });

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
                No nav links. Click on <b>Add Link</b> to start.
              </Trans>
            </div>
          )}

          {fields.map((f, i) => (
            <SortableNavLinkItem
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
              active: true,
              link: undefined,
              children: [],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> <Trans>Add Link</Trans>
        </Button>
      </div>
    </div>
  );
}

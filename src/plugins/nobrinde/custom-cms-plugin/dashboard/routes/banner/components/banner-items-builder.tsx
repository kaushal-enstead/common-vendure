import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormFieldWrapper,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  useFieldArray,
  useFormContext,
} from '@vendure/dashboard';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, ChevronUp, ChevronDown, Copy, MousePointerClick } from 'lucide-react';
import { Input } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { AssetFieldWithPicker } from '../../../shared/asset-field-with-picker.js';

// Hardcoded linkRef options grouped by entity - will be replaced with dynamic data in future
const LINK_REF_OPTIONS = [
  {
    entity: 'page',
    items: [
      { label: 'Home Page', value: '1' },
      { label: 'About Page', value: '2' },
      { label: 'Contact Page', value: '3' },
    ],
  },
  {
    entity: 'document',
    items: [
      { label: 'Document 1', value: '1' },
      { label: 'Document 2', value: '2' },
      { label: 'Document 3', value: '3' },
    ],
  },
  {
    entity: 'new',
    items: [
      { label: 'News Article 1', value: '1' },
      { label: 'News Article 2', value: '2' },
      { label: 'News Article 3', value: '3' },
    ],
  },
];

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

/** Sortable Banner item */
function SortableBannerItem({
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
  const buttonType = watch(`${formName}.${index}.button.type`);

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
              <Input {...field} value={field.value as string} placeholder="Enter banner name..." />
            )}
          />

          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.description`}
            label={<Trans>Description</Trans>}
            render={({ field }) => (
              <Input {...field} value={(field.value as string) || ''} placeholder="Enter banner description..." />
            )}
          />

          <FormFieldWrapper
            control={control}
            name={`${formName}.${index}.assetId`}
            label={<Trans>Asset</Trans>}
            render={() => (
              <AssetFieldWithPicker
                name={`${formName}.${index}.assetId`}
                placeholder="Asset ID or URL"
                dialogTitle="Select Asset"
              />
            )}
          />

          {/* Button Configuration */}
          <div className="border-t border-dashed pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <MousePointerClick className="size-4 text-muted-foreground" />
              <div className="text-sm font-semibold">
                <Trans>Button Configuration</Trans>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-4 border">
              {/* Row 1: Label and Open in New Tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFieldWrapper
                  control={control}
                  name={`${formName}.${index}.button.label`}
                  label={<Trans>Button Label</Trans>}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ''} placeholder="e.g., Learn More, Shop Now..." />
                  )}
                />

                <div className="flex flex-col justify-end">
                  <FormFieldWrapper
                    control={control}
                    name={`${formName}.${index}.button.openInNewTab`}
                    label={<Trans>Open in New Tab</Trans>}
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            <Trans>Open in new browser tab</Trans>
                          </span>
                          {/* <span className="text-xs text-muted-foreground">
                            <Trans>Open the link in a new browser tab</Trans>
                          </span> */}
                        </div>
                        <Switch
                          defaultChecked={false}
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Row 2: Button Type and Link/URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFieldWrapper
                  control={control}
                  name={`${formName}.${index}.button.type`}
                  label={<Trans>Button Type</Trans>}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">
                          <Trans>External</Trans>
                        </SelectItem>
                        <SelectItem value="internal">
                          <Trans>Internal</Trans>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {!buttonType ? null : buttonType === 'external' ? (
                  <FormFieldWrapper
                    control={control}
                    name={`${formName}.${index}.button.url`}
                    label={<Trans>URL</Trans>}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="https://example.com"
                        type="url"
                      />
                    )}
                  />
                ) : (
                  <FormFieldWrapper
                    control={control}
                    name={`${formName}.${index}.button.linkRef`}
                    label={<Trans>Link Reference</Trans>}
                    render={({ field }) => {
                      const currentValue = (field.value as { entity: string; value: string }) || {
                        entity: '',
                        value: '',
                      };

                      // Find the selected option from grouped structure
                      let selectedOption: { entity: string; label: string; value: string } | null = null;
                      if (currentValue?.entity && currentValue?.value) {
                        const group = LINK_REF_OPTIONS.find(g => g.entity === currentValue.entity);
                        if (group) {
                          const item = group.items.find(i => i.value === currentValue.value);
                          if (item) {
                            selectedOption = { entity: group.entity, label: item.label, value: item.value };
                          }
                        }
                      }

                      return (
                        <div className="space-y-2">
                          <Select
                            value={selectedOption ? `${selectedOption.entity}:${selectedOption.value}` : ''}
                            onValueChange={value => {
                              const [entity, val] = value.split(':');
                              const linkRef = { entity, value: val };
                              field.onChange(linkRef);
                              setValue(`${formName}.${index}.button.linkRef`, linkRef, { shouldDirty: true });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select link reference" />
                            </SelectTrigger>
                            <SelectContent>
                              {LINK_REF_OPTIONS.map(group => (
                                <SelectGroup key={group.entity}>
                                  <SelectLabel className="font-semibold text-sm capitalize">
                                    {group.entity}
                                  </SelectLabel>
                                  {group.items.map(item => (
                                    <SelectItem
                                      key={`${group.entity}:${item.value}`}
                                      value={`${group.entity}:${item.value}`}
                                    >
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/** Main Banner items builder with drag & drop */
export function BannerItemsBuilder({ name }: { name: string }) {
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
                No banner items. Click on <b>Add Item</b> to start.
              </Trans>
            </div>
          )}

          {fields.map((f, i) => (
            <SortableBannerItem
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
              description: '',
              assetId: '',
              index: currentValues.length,
              button: {
                label: '',
                type: 'external',
                openInNewTab: false,
                url: '',
                linkRef: { entity: 'tablename', value: '' },
              },
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> <Trans>Add Item</Trans>
        </Button>
      </div>
    </div>
  );
}

import { FormFieldWrapper, Input, Button, useFieldArray, useFormContext } from '@vendure/dashboard';
import { Plus, Trash2 } from 'lucide-react';
import { Trans } from '@lingui/react/macro';

export function StatsItemsField({ name }: { name: string }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          <Trans>Stats Items</Trans>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ label: '', value: '' })}>
          <Plus className="mr-2 h-4 w-4" />
          <Trans>Add Item</Trans>
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2 p-3 border rounded-md">
          <FormFieldWrapper
            control={control}
            label={<Trans>Label</Trans>}
            name={`${name}.${index}.label`}
            render={({ field }) => (
              <Input {...field} value={field.value || ''} placeholder="Label" className="flex-1" />
            )}
          />
          <FormFieldWrapper
            control={control}
            label={<Trans>Value</Trans>}
            name={`${name}.${index}.value`}
            render={({ field }) => (
              <Input {...field} value={field.value || ''} placeholder="Value" className="flex-1" />
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} title="Remove">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      {fields.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Trans>No stats items. Click "Add Item" to add one.</Trans>
        </div>
      )}
    </div>
  );
}

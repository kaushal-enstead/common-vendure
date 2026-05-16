import { Button, FormFieldWrapper, useFieldArray, useFormContext } from '@vendure/dashboard';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';

export function TargetUrlsField({ name }: { name: string }) {
  const form = useFormContext();
  const { fields, append, remove } = useFieldArray({ control: form.control, name });

  return (
    <div className="space-y-2">
      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground border rounded-md p-3">
          <Trans>
            No target URLs. Click on <b>Add URL</b> to start.
          </Trans>
        </div>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormFieldWrapper
            control={form.control}
            name={`${name}.${index}`}
            label=""
            render={({ field: inputField }) => (
              <Input
                {...inputField}
                value={inputField.value || ''}
                placeholder="e.g., /page, /products, https://example.com"
                className="flex-1"
              />
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} title="Remove URL">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <div className="pt-1">
        <Button type="button" variant="secondary" onClick={() => append('')}>
          <Plus className="mr-2 h-4 w-4" /> <Trans>Add URL</Trans>
        </Button>
      </div>
    </div>
  );
}

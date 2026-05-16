import {
  Button,
  FormFieldWrapper,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFieldArray,
  useFormContext,
  useWatch,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';

type ContentType = 'news' | 'authors' | 'collections' | 'kits' | 'productVariants';
type FilterCombinator = 'AND' | 'OR';

type EntityFilterField = {
  value: string;
  label: string;
  valueType: 'string' | 'boolean' | 'number';
  operator: 'eq' | 'gte';
};

const filterFieldsByEntity: Record<string, EntityFilterField[]> = {
  news: [{ value: 'limit', label: 'Limit At Least', valueType: 'number', operator: 'eq' }],
  authors: [{ value: 'limit', label: 'Limit At Least', valueType: 'number', operator: 'eq' }],
  collections: [
    {
      value: 'customFields.categoryType',
      label: 'Custom Fields Category Type',
      valueType: 'string',
      operator: 'eq',
    },
  ],
  kits: [
    {
      value: 'type',
      label: 'Kit Type',
      valueType: 'string',
      operator: 'eq',
    },
  ],
  productVariants: [
    { value: 'limit', label: 'Limit At Least', valueType: 'number', operator: 'eq' },
    { value: 'customFields.is_new', label: 'Is New', valueType: 'boolean', operator: 'eq' },
    { value: 'customFields.is_promotion', label: 'Is Promotion', valueType: 'boolean', operator: 'eq' },
    { value: 'customFields.is_featured', label: 'Is Featured', valueType: 'boolean', operator: 'eq' },
    { value: 'customFields.is_best_seller', label: 'Is Best Seller', valueType: 'boolean', operator: 'eq' },
  ],
};

export function EntitySelectorField({ name, contentType }: { name: string; contentType: ContentType }) {
  const { control, setValue } = useFormContext();
  const filterCombinator = useWatch({ control, name: `${name}.filters.combinator` }) as
    | FilterCombinator
    | undefined;
  const conditionsName = `${name}.filters.conditions`;
  const watchedConditions = useWatch({ control, name: conditionsName }) as
    | Array<{ field?: string; value?: string | boolean | number }>
    | undefined;
  const {
    fields: conditions,
    append,
    remove,
  } = useFieldArray({
    control,
    name: conditionsName,
  });

  const availableFilterFields = filterFieldsByEntity[contentType] || [];

  useEffect(() => {
    if (!filterCombinator) {
      setValue(`${name}.filters.combinator`, 'AND', { shouldDirty: true });
    }
    if (!Array.isArray(conditions)) {
      setValue(conditionsName, [], { shouldDirty: true });
    }
  }, [conditions, conditionsName, filterCombinator, name, setValue]);

  const addCondition = () => {
    if (availableFilterFields.length === 0) {
      return;
    }
    const defaultField = availableFilterFields[0];
    append({
      field: defaultField.value,
      operator: defaultField.operator,
      value: defaultField.valueType === 'boolean' ? true : defaultField.valueType === 'number' ? 1 : '',
    });
  };

  const setConditionField = (index: number, fieldName: string) => {
    const selectedField = availableFilterFields.find(field => field.value === fieldName);
    setValue(`${conditionsName}.${index}.field`, fieldName, { shouldDirty: true });
    setValue(`${conditionsName}.${index}.operator`, selectedField?.operator || 'eq', { shouldDirty: true });
    if (selectedField?.valueType === 'boolean') {
      setValue(`${conditionsName}.${index}.value`, true, { shouldDirty: true });
      return;
    }
    if (selectedField?.valueType === 'number') {
      setValue(`${conditionsName}.${index}.value`, 1, { shouldDirty: true });
      return;
    }
    setValue(`${conditionsName}.${index}.value`, '', { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border p-3">
        <div className="grid grid-cols-2 gap-4">
          <FormFieldWrapper
            control={control}
            name={`${name}.filters.combinator`}
            label={<Trans>Conditions Mode</Trans>}
            render={({ field }) => (
              <Select value={field.value || 'AND'} onValueChange={value => field.onChange(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={<Trans>Select mode</Trans>} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">
                    <Trans>AND</Trans>
                  </SelectItem>
                  <SelectItem value="OR">
                    <Trans>OR</Trans>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={addCondition}>
              <Trans>Add condition</Trans>
            </Button>
          </div>
        </div>

        {conditions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <Trans>No conditions yet. Add your first condition.</Trans>
          </p>
        )}

        {conditions.map((condition, index) => {
          const selectedFieldName = watchedConditions?.[index]?.field;
          const selectedField = availableFilterFields.find(field => field.value === selectedFieldName);
          const isBooleanField = selectedField?.valueType === 'boolean';
          const isNumberField = selectedField?.valueType === 'number';

          return (
            <div key={condition.id} className="grid grid-cols-[1fr_120px_1fr_auto] gap-2 items-end">
              <FormFieldWrapper
                control={control}
                name={`${conditionsName}.${index}.field`}
                label={index === 0 ? <Trans>Field</Trans> : undefined}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={value => setConditionField(index, value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={<Trans>Select field</Trans>} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilterFields.map(filterField => (
                        <SelectItem key={filterField.value} value={filterField.value}>
                          {filterField.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <FormFieldWrapper
                control={control}
                name={`${conditionsName}.${index}.operator`}
                label={index === 0 ? <Trans>Operator</Trans> : undefined}
                render={({ field }) => (
                  <Input value={field.value || selectedField?.operator || 'eq'} disabled />
                )}
              />

              <FormFieldWrapper
                control={control}
                name={`${conditionsName}.${index}.value`}
                label={index === 0 ? <Trans>Value</Trans> : undefined}
                render={({ field }) =>
                  isBooleanField ? (
                    <Select
                      value={field.value === false ? 'false' : 'true'}
                      onValueChange={value => field.onChange(value === 'true')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={isNumberField ? 'number' : 'text'}
                      value={
                        isNumberField
                          ? typeof field.value === 'number'
                            ? field.value
                            : 1
                          : typeof field.value === 'string'
                            ? field.value
                            : ''
                      }
                      onChange={e =>
                        field.onChange(
                          isNumberField ? Math.max(1, Number(e.target.value) || 1) : e.target.value,
                        )
                      }
                      placeholder={isNumberField ? '1' : 'Value'}
                    />
                  )
                }
              />

              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} title="Delete">
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

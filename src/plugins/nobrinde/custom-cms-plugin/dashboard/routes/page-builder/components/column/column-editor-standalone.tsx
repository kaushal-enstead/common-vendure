import {
  FormFieldWrapper,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RichTextInput,
  useWatch,
  useFormContext,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { AssetFieldWithPicker } from '../../../../shared/asset-field-with-picker';
import { AlertButtonField } from '../../../alert/components/alert-button-field';
import { StatsItemsField } from './column-types/stats-type';
import { FaqSelectorField } from './column-types/faq-type';
import { BannerSelectorField } from './column-types/banner-type';
import { EntitySelectorField } from './column-types/entity-type';
import { DocumentSelectorField } from './column-types/document-type';

interface ColumnEditorStandaloneProps {
  columnIndex: number;
  columnsFieldName: string;
}

const columnTypes = [
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
  { value: 'cta', label: 'CTA' },
  { value: 'content', label: 'Content' },
  { value: 'stats', label: 'Stats' },
  { value: 'faq', label: 'FAQ' },
  { value: 'document', label: 'Document' },
  { value: 'banner', label: 'Banner' },
  { value: 'news', label: 'News' },
  { value: 'authors', label: 'Authors' },
  { value: 'collections', label: 'Collections' },
  { value: 'kits', label: 'Kits' },
  { value: 'productVariants', label: 'Product Variants' },
];

export function ColumnEditorStandalone({ columnIndex, columnsFieldName }: ColumnEditorStandaloneProps) {
  const { control, setValue } = useFormContext();

  return (
    <div className="space-y-4">
      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.type`}
          label={<Trans>Content Type</Trans>}
          render={({ field }) => (
            <Select
              {...field}
              defaultValue={field.value}
              onValueChange={value => {
                setValue(`${columnsFieldName}.${columnIndex}.type`, value);
                // Reset data structure based on new type
                if (value === 'video') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, { type: value, label: '', url: '' });
                } else if (value === 'image') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, {
                    type: value,
                    label: '',
                    url: '',
                    title: '',
                    subtitle: '',
                  });
                } else if (value === 'cta') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, {
                    type: 'cta',
                    title: '',
                    description: '',
                  });
                } else if (value === 'content') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, { type: 'content', description: '' });
                } else if (value === 'stats') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, { type: 'stats', items: [] });
                } else if (value === 'faq') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, { type: 'faq', itemId: '' });
                } else if (value === 'document') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, { type: 'document', itemId: '' });
                } else if (value === 'banner') {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, { type: 'banner', itemId: '' });
                } else if (['news', 'authors', 'collections', 'kits', 'productVariants'].includes(value)) {
                  setValue(`${columnsFieldName}.${columnIndex}.data`, {
                    type: value,
                    filters: {
                      combinator: 'AND',
                      conditions: [],
                    },
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* Label */}
        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.label`}
          label={<Trans>Label</Trans>}
          render={({ field }) => (
            <Input {...field} value={field.value || ''} placeholder="Column label (optional)" />
          )}
        />
      </div>

      <ColumnDataForm columnIndex={columnIndex} columnsFieldName={columnsFieldName} />
    </div>
  );
}

export const ColumnDataForm = ({
  columnIndex,
  columnsFieldName,
}: {
  columnIndex: number;
  columnsFieldName: string;
}) => {
  const { control } = useFormContext();
  const type = useWatch({ control, name: `${columnsFieldName}.${columnIndex}.type` });

  if (type === 'video') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            <Trans>Video URL or Asset</Trans>
          </label>
          <AssetFieldWithPicker
            name={`${columnsFieldName}.${columnIndex}.data.url`}
            placeholder="Video URL (YouTube, etc.) or Asset ID"
            dialogTitle="Select Video Asset"
            type="video"
          />
        </div>
      </div>
    );
  } else if (type === 'image') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            <Trans>Image URL or Asset</Trans>
          </label>
          <AssetFieldWithPicker
            name={`${columnsFieldName}.${columnIndex}.data.url`}
            placeholder="Image URL or Asset ID"
            dialogTitle="Select Image Asset"
            type="image"
          />
        </div>
        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.data.title`}
          label={<Trans>Title</Trans>}
          render={({ field }) => <RichTextInput {...field} value={field.value || ''} />}
        />
        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.data.subtitle`}
          label={<Trans>Subtitle</Trans>}
          render={({ field }) => <RichTextInput {...field} value={field.value || ''} />}
        />
        <AlertButtonField name={`${columnsFieldName}.${columnIndex}.data.button`} />
      </div>
    );
  } else if (type === 'cta') {
    return (
      <div className="space-y-4">
        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.data.title`}
          label={<Trans>Title</Trans>}
          render={({ field }) => <RichTextInput {...field} value={field.value || ''} />}
        />

        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.data.description`}
          label={<Trans>Description</Trans>}
          render={({ field }) => <RichTextInput {...field} value={field.value || ''} />}
        />

        <AlertButtonField name={`${columnsFieldName}.${columnIndex}.data.button`} />
      </div>
    );
  } else if (type === 'content') {
    return (
      <div className="space-y-4">
        <FormFieldWrapper
          control={control}
          name={`${columnsFieldName}.${columnIndex}.data.description`}
          label={<Trans>Description</Trans>}
          render={({ field }) => <RichTextInput {...field} value={field.value || ''} />}
        />
      </div>
    );
  } else if (type === 'stats') {
    return <StatsItemsField name={`${columnsFieldName}.${columnIndex}.data.items`} />;
  } else if (type === 'faq') {
    return <FaqSelectorField name={`${columnsFieldName}.${columnIndex}.data.itemId`} />;
  } else if (type === 'document') {
    return <DocumentSelectorField name={`${columnsFieldName}.${columnIndex}.data.itemId`} />;
  } else if (type === 'banner') {
    return <BannerSelectorField name={`${columnsFieldName}.${columnIndex}.data.itemId`} />;
  } else if (['news', 'authors', 'collections', 'kits', 'productVariants'].includes(type)) {
    return (
      <EntitySelectorField
        name={`${columnsFieldName}.${columnIndex}.data`}
        contentType={type as 'news' | 'authors' | 'collections' | 'kits' | 'productVariants'}
      />
    );
  }

  return null;
};

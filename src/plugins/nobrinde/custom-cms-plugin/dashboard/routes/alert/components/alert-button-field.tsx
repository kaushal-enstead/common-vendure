import {
  FormFieldWrapper,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  Input,
  useFormContext,
  useQuery,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { MousePointerClick } from 'lucide-react';
import { api } from '@vendure/dashboard';
import { linkRefOptionsDocument } from '../alert.graphql';

export function AlertButtonField({ name }: { name: string }) {
  const { control, watch, setValue } = useFormContext();
  const buttonType = watch(`${name}.type`);

  // Query link reference options
  const { data: linkRefData, isLoading: isLoadingLinkRefs } = useQuery({
    queryKey: ['link-ref-options'],
    queryFn: () => api.query(linkRefOptionsDocument),
  });

  // Transform the API response into the format expected by the component
  const linkRefOptions = linkRefData?.linkRefOptions
    ? [
        {
          entity: 'page',
          items: linkRefData.linkRefOptions.page.map((item: { label: string; value: string }) => ({
            label: item.label,
            value: item.value,
          })),
        },
        {
          entity: 'author',
          items: linkRefData.linkRefOptions.author.map((item: { label: string; value: string }) => ({
            label: item.label,
            value: item.value,
          })),
        },
        {
          entity: 'document',
          items: linkRefData.linkRefOptions.document.map((item: { label: string; value: string }) => ({
            label: item.label,
            value: item.value,
          })),
        },
      ]
    : [];

  return (
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
            name={`${name}.label`}
            label={<Trans>Button Label</Trans>}
            render={({ field }) => (
              <Input {...field} value={field.value || ''} placeholder="e.g., Learn More, Shop Now..." />
            )}
          />

          <div className="flex flex-col justify-end">
            <FormFieldWrapper
              control={control}
              name={`${name}.openInNewTab`}
              label={<Trans>Open in New Tab</Trans>}
              render={({ field }) => (
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      <Trans>Open in new browser tab</Trans>
                    </span>
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
            name={`${name}.type`}
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
              name={`${name}.url`}
              label={<Trans>URL</Trans>}
              render={({ field }) => (
                <Input {...field} value={field.value || ''} placeholder="https://example.com" type="url" />
              )}
            />
          ) : (
            <FormFieldWrapper
              control={control}
              name={`${name}.linkRef`}
              label={<Trans>Link Reference</Trans>}
              render={({ field }) => {
                const currentValue = (field.value as { entity: string; value: string }) || {
                  entity: '',
                  value: '',
                };

                // Find the selected option from grouped structure
                let selectedOption: { entity: string; label: string; value: string } | null = null;
                if (currentValue?.entity && currentValue?.value) {
                  const group = linkRefOptions.find(g => g.entity === currentValue.entity);
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
                        setValue(`${name}.linkRef`, linkRef, { shouldDirty: true });
                      }}
                      disabled={isLoadingLinkRefs}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingLinkRefs ? 'Loading options...' : 'Select link reference'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!isLoadingLinkRefs && linkRefOptions.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            <Trans>No options available</Trans>
                          </div>
                        ) : (
                          linkRefOptions
                            .filter(group => group.items.length > 0)
                            .map(group => (
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
                            ))
                        )}
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
  );
}

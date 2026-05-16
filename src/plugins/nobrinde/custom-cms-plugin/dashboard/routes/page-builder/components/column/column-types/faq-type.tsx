import {
  FormFieldWrapper,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFormContext,
  useQuery,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { api } from '@vendure/dashboard';
import { faqListDocument } from '../../../../faq/faq.graphql';

export function FaqSelectorField({ name }: { name: string }) {
  const { control } = useFormContext();
  // Query active FAQs
  const { data: faqsData, isLoading } = useQuery({
    queryKey: ['active-faqs'],
    queryFn: () =>
      api.query(faqListDocument, {
        options: {
          filter: {
            active: { eq: true },
          },
        },
      }),
  });

  const faqs = faqsData?.faqs?.items || [];

  return (
    <FormFieldWrapper
      control={control}
      name={name}
      label={<Trans>FAQ</Trans>}
      render={({ field }) => (
        <Select
          value={field.value || ''}
          onValueChange={value => {
            field.onChange(value);
            // setValue(name, value, { shouldDirty: true });
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? 'Loading FAQs...' : 'Select FAQ'} />
          </SelectTrigger>
          <SelectContent>
            {faqs.length === 0 ? (
              <SelectItem value={undefined} disabled>
                {isLoading ? <Trans>Loading...</Trans> : <Trans>No active FAQs found</Trans>}
              </SelectItem>
            ) : (
              faqs.map(faq => (
                <SelectItem key={faq.id} value={faq.id}>
                  {faq.title || faq.code || faq.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    />
  );
}

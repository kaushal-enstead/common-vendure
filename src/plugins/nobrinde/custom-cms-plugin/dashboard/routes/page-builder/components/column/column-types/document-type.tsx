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
import { documentListDocument } from '../../../../document/document.graphql';

export function DocumentSelectorField({ name }: { name: string }) {
  const { control } = useFormContext();

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['active-documents'],
    queryFn: () =>
      api.query(documentListDocument, {
        options: {
          filter: {
            active: { eq: true },
          },
        },
      }),
    networkMode: 'offlineFirst',
  });

  const documents = documentsData?.documents?.items || [];

  return (
    <FormFieldWrapper
      control={control}
      name={name}
      label={<Trans>Document</Trans>}
      render={({ field }) => (
        <Select value={field.value || ''} onValueChange={field.onChange} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? 'Loading Documents...' : 'Select Document'} />
          </SelectTrigger>
          <SelectContent>
            {documents.length === 0 ? (
              <SelectItem value={undefined} disabled>
                {isLoading ? <Trans>Loading...</Trans> : <Trans>No active documents found</Trans>}
              </SelectItem>
            ) : (
              documents.map(document => (
                <SelectItem key={document.id} value={document.id}>
                  {document.title || document.code || document.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    />
  );
}

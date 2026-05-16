import {
  MultiSelect,
  FormFieldWrapper,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFormContext,
  useQuery,
} from '@vendure/dashboard';
import { api } from '@vendure/dashboard';
import { authorsForSelectDocument, newsForSelectDocument } from '../news.graphql.js';
import { Trans, useLingui } from '@lingui/react/macro';

export function AuthorSelector({ name, defaultValue }: { name: string; defaultValue: string }) {
  const { control } = useFormContext();

  const { data: authorsData } = useQuery({
    queryKey: ['authors-for-select'],
    queryFn: () => api.query(authorsForSelectDocument, { options: {} }),
  });

  const authors = authorsData?.authors?.items || [];

  return (
    <FormFieldWrapper
      control={control}
      name={name}
      label={<Trans>Author</Trans>}
      render={({ field }) => (
        <Select
          defaultValue={defaultValue}
          value={field.value || undefined}
          onValueChange={value => {
            field.onChange(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={<Trans>Select author</Trans>} />
          </SelectTrigger>
          <SelectContent>
            {authors.map(author => (
              <SelectItem key={author.id} value={author.id}>
                {author.name} - {author.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

export function RelatedNewsSelector({
  entityId,
  name,
  defaultValue,
}: {
  entityId: string;
  name: string;
  defaultValue: string[];
}) {
  const { control, watch, setValue } = useFormContext();
  const { t } = useLingui();

  const { data: newsData } = useQuery({
    queryKey: ['news-for-select'],
    queryFn: () => api.query(newsForSelectDocument, { options: {} }),
  });

  const allNews = newsData?.newsList?.items || [];
  // Filter out current news from the list
  const availableNews = allNews.filter(news => news.id !== entityId);

  const handleSelectionChange = (selectedIds: string[]) => {
    setValue(name, selectedIds, { shouldDirty: true });
  };

  return (
    <FormFieldWrapper
      control={control}
      name={name}
      label={<Trans>Related News</Trans>}
      render={({ field }) => (
        <div className="space-y-2">
          <MultiSelect
            value={field.value || defaultValue}
            onChange={field.onChange}
            multiple={true}
            items={availableNews.map(news => ({ label: news.title, value: news.id }))}
            placeholder={t`Select related news`}
            searchPlaceholder={t`Search related news...`}
          />
        </div>
      )}
    />
  );
}

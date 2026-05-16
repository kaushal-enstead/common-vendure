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
import { Trans } from '@lingui/react/macro';
import { graphql } from '@/gql';

export type CategoryType = 'news' | 'authors' | 'faq';

// Query for category dropdown (filtered by type)
export const categoriesForSelectDocument = graphql(`
  query CategoriesForSelect($options: CategoryListOptions) {
    categories(options: $options) {
      items {
        id
        name
        type
      }
      totalItems
    }
  }
`);

export function CategoryPicker({
  name,
  defaultValue,
  type,
}: {
  name: string;
  defaultValue: string;
  type: CategoryType;
}) {
  const { control } = useFormContext();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-for-select', type],
    queryFn: () =>
      api.query(categoriesForSelectDocument, {
        options: {
          filter: {
            type: { eq: type },
            active: { eq: true },
          },
        },
      }),
  });

  const categories = categoriesData?.categories?.items || [];

  return (
    <FormFieldWrapper
      control={control}
      name={name}
      label={<Trans>Category</Trans>}
      render={({ field }) => (
        <Select
          defaultValue={defaultValue}
          value={field.value || undefined}
          onValueChange={value => {
            field.onChange(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={<Trans>Select category</Trans>} />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

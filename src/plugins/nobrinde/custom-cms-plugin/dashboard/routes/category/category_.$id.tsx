import {
  Button,
  DashboardRouteDefinition,
  DetailFormGrid,
  detailPageRouteLoader,
  FormFieldWrapper,
  Input,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import {
  createCategoryDocument,
  categoryDetailDocument,
  updateCategoryDocument,
} from './category.graphql.js';

const pageId = 'category-detail';
const NEW_ENTITY_PATH = 'new';

const CATEGORY_TYPES = [
  { value: 'news', label: 'News' },
  { value: 'authors', label: 'Authors' },
] as const;

export const categoryDetail: DashboardRouteDefinition = {
  path: '/cms/categories/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: categoryDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/categories', label: <Trans>Categories</Trans> },
        isNew ? <Trans>New Category</Trans> : entity?.name,
      ];
    },
  }),
  component: route => {
    const params = route.useParams();
    const navigate = useNavigate();
    const creatingNewEntity = params.id === NEW_ENTITY_PATH;
    const { t } = useLingui();

    const { form, submitHandler, entity, isPending, refreshEntity, resetForm } = useDetailPage({
      pageId,
      entityName: 'Category',
      queryDocument: categoryDetailDocument,
      createDocument: createCategoryDocument,
      updateDocument: updateCategoryDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          name: entity.name,
          description: entity.description || '',
          type: entity.type || null,
          active: entity.active,
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(
          creatingNewEntity ? t`Successfully created category` : t`Successfully updated category`,
        );
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create category` : t`Failed to update category`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New category</Trans> : (entity?.name ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateCategory']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              {creatingNewEntity ? <Trans>Create</Trans> : <Trans>Update</Trans>}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="enabled-toggle">
            <FormFieldWrapper
              control={form.control}
              name="active"
              label={<Trans>Active</Trans>}
              description={<Trans>When active, a category is available</Trans>}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </PageBlock>
          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="name"
                label={<Trans>Name</Trans>}
                render={({ field }) => (
                  <Input {...field} value={field.value as string} placeholder="Category Name" />
                )}
              />
              <FormFieldWrapper
                control={form.control}
                name="type"
                label={<Trans>Type</Trans>}
                render={({ field }) => {
                  return (
                    <Select
                      defaultValue={entity?.type || undefined}
                      value={field.value || undefined}
                      onValueChange={value => {
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={<Trans>Select type</Trans>} />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              <FormFieldWrapper
                control={form.control}
                name="description"
                label={<Trans>Description</Trans>}
                render={({ field }) => (
                  <Input {...field} value={field.value as string} placeholder="Category Description" />
                )}
              />
            </DetailFormGrid>
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

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
  Switch,
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { createAuthorDocument, authorDetailDocument, updateAuthorDocument } from './author.graphql.js';
import { AssetFieldWithPicker } from '../../shared/asset-field-with-picker.js';

const pageId = 'author-detail';
const NEW_ENTITY_PATH = 'new';

export const authorDetail: DashboardRouteDefinition = {
  path: '/cms/authors/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: authorDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/authors', label: <Trans>Authors</Trans> },
        isNew ? <Trans>New Author</Trans> : entity?.name,
      ];
    },
  }),
  component: route => {
    const params = route.useParams();
    const navigate = useNavigate();
    const creatingNewEntity = params.id === NEW_ENTITY_PATH;
    const { t } = useLingui();
    const refreshRef = useRef<() => void>(() => {});

    const { form, submitHandler, entity, isPending, refreshEntity, resetForm } = useDetailPage({
      pageId,
      entityName: 'Author',
      queryDocument: authorDetailDocument,
      createDocument: createAuthorDocument,
      updateDocument: updateAuthorDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          name: entity.name,
          logo: entity.logo || '',
          active: entity.active,
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            title: translation.title || '',
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created author` : t`Successfully updated author`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create author` : t`Failed to update author`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New author</Trans> : (entity?.name ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateAuthor']}>
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
              description={<Trans>When active, an author is available in the shop</Trans>}
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
                  <Input {...field} value={field.value as string} placeholder="author-name" />
                )}
              />
              <TranslatableFormFieldWrapper
                control={form.control}
                name="title"
                label={<Trans>Title</Trans>}
                render={({ field }) => (
                  <Input {...field} value={field.value as string} placeholder="Author Title" />
                )}
              />
            </DetailFormGrid>
          </PageBlock>

          <PageBlock column="main" blockId="logo-form">
            <FormFieldWrapper
              control={form.control}
              name="logo"
              label={<Trans>Logo</Trans>}
              render={() => (
                <AssetFieldWithPicker
                  // layout="vertical"
                  name="logo"
                  placeholder="Asset ID or URL"
                  dialogTitle="Select Logo"
                />
              )}
            />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

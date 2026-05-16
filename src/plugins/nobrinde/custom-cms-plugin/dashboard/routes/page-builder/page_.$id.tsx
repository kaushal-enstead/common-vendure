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
  SlugInput,
  Switch,
  useDetailPage,
  Textarea,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { createPageDocument, pageDetailDocument, updatePageDocument } from './page.graphql.js';
import { BlockList } from './components/block/block-list.js';
import { AssetFieldWithPicker } from '../../shared/asset-field-with-picker';

const pageId = 'page-detail';
const NEW_ENTITY_PATH = 'new';

export const pageDetail: DashboardRouteDefinition = {
  path: '/cms/pages/$id',
  // loader: async ({ params }) => {
  //   if (params.id === NEW_ENTITY_PATH) {
  //     return { entity: null };
  //   }
  //   // Load page detail
  //   return {};
  // },
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: pageDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/pages', label: <Trans>Pages</Trans> },
        isNew ? <Trans>New Page</Trans> : entity?.title,
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
      entityName: 'Page',
      queryDocument: pageDetailDocument,
      createDocument: createPageDocument,
      updateDocument: updatePageDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          title: entity.title || '',
          slug: entity.slug || '',
          active: entity.active ?? true,
          seo: entity.seo || { title: '', image: '', description: '' },
          // Blocks are managed separately via block-level APIs - not included in page form
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created page` : t`Successfully updated page`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create page` : t`Failed to update page`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New Page</Trans> : (entity?.title ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdatePage']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              {creatingNewEntity ? <Trans>Create</Trans> : <Trans>Update</Trans>}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="title"
                label={<Trans>Title</Trans>}
                render={({ field }) => <Input {...field} value={field.value as string} />}
              />
              <FormFieldWrapper
                control={form.control}
                name="slug"
                label={<Trans>Slug</Trans>}
                render={({ field }) => (
                  <SlugInput
                    {...field}
                    entityName="Page"
                    fieldName="slug"
                    watchFieldName="title"
                    entityId={entity?.id}
                  />
                )}
              />
            </DetailFormGrid>
          </PageBlock>
          <PageBlock column="side" blockId="page-enabled-toggle">
            <FormFieldWrapper
              control={form.control}
              name="active"
              label={<Trans>Active</Trans>}
              description={<Trans>When active, a page is available in the shop</Trans>}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </PageBlock>

          <PageBlock column="side" blockId="page-seo">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                <Trans>SEO</Trans>
              </h3>
              <FormFieldWrapper
                control={form.control}
                name="seo.title"
                label={<Trans>Title</Trans>}
                render={({ field }) => <Input {...field} value={field.value || ''} placeholder="SEO title" />}
              />
              <FormFieldWrapper
                control={form.control}
                name="seo.description"
                label={<Trans>Description</Trans>}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="SEO description"
                    rows={3}
                    className="resize-none"
                  />
                )}
              />
              <FormFieldWrapper
                control={form.control}
                name="seo.image"
                label={<Trans>Image</Trans>}
                render={({ field }) => (
                  <AssetFieldWithPicker
                    name={field.name}
                    layout="vertical"
                    placeholder="Asset ID or URL"
                    dialogTitle="Select SEO Image"
                    type="image"
                  />
                )}
              />
            </div>
          </PageBlock>

          <PageBlock column="main" blockId="blocks-form">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                <Trans>Blocks</Trans>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {creatingNewEntity ? (
                  <Trans>Save the page first to start adding blocks</Trans>
                ) : (
                  <Trans>Manage blocks for this page. Each block operation is saved immediately.</Trans>
                )}
              </p>
            </div>

            <BlockList pageId={entity?.id || ''} onRefresh={refreshEntity} />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

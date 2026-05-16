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
  RichTextInput,
  Textarea,
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { createNewsDocument, newsDetailDocument, updateNewsDocument } from './news.graphql.js';
import { AssetFieldWithPicker } from '../../shared/asset-field-with-picker.js';
import { AuthorSelector, RelatedNewsSelector } from './components/news-selectors.js';
import { CategoryPicker } from '../../shared/category-picker.js';

const pageId = 'news-detail';
const NEW_ENTITY_PATH = 'new';

export const newsDetail: DashboardRouteDefinition = {
  path: '/cms/news/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: newsDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/news', label: <Trans>News</Trans> },
        isNew ? <Trans>New News</Trans> : entity?.title,
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
      entityName: 'News',
      queryDocument: newsDetailDocument,
      createDocument: createNewsDocument,
      updateDocument: updateNewsDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          src: entity.src || '',
          authorId: entity.authorId || null,
          relatedNewsIds: entity.relatedNewsIds || [],
          categoryId: entity.categoryId || null,
          seo: entity.seo || {
            title: '',
            image: '',
            description: '',
          },
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            title: translation.title || '',
            description: translation.description || '',
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created news` : t`Successfully updated news`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create news` : t`Failed to update news`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New news</Trans> : (entity?.title ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateNews']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              {creatingNewEntity ? <Trans>Create</Trans> : <Trans>Update</Trans>}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="main" blockId="main-form">
            {/* <DetailFormGrid> */}
            <TranslatableFormFieldWrapper
              control={form.control}
              name="title"
              label={<Trans>Title</Trans>}
              render={({ field }) => (
                <Input {...field} value={field.value as string} placeholder="News Title" />
              )}
            />
            <br />
            <TranslatableFormFieldWrapper
              control={form.control}
              name="description"
              label={<Trans>Description</Trans>}
              render={({ field }) => (
                <RichTextInput
                  {...field}
                  value={field.value as string}
                  // placeholder="News Description"
                  // rows={4}
                />
              )}
            />
            {/* </DetailFormGrid> */}
          </PageBlock>

          <PageBlock column="side" blockId="src-form">
            <FormFieldWrapper
              control={form.control}
              name="src"
              label={<Trans>Source Image</Trans>}
              render={() => (
                <AssetFieldWithPicker
                  layout="vertical"
                  name="src"
                  placeholder="Asset ID or URL"
                  dialogTitle="Select Source Image"
                />
              )}
            />
          </PageBlock>

          <PageBlock column="side" blockId="author-category-form">
            <AuthorSelector name="authorId" defaultValue={entity?.authorId || ''} />
            <div className="mt-4">
              <CategoryPicker name="categoryId" defaultValue={entity?.categoryId || ''} type="news" />
            </div>
            <div className="mt-4">
              <RelatedNewsSelector
                entityId={entity?.id || ''}
                name="relatedNewsIds"
                defaultValue={entity?.relatedNewsIds || []}
              />
            </div>
          </PageBlock>

          <PageBlock column="main" blockId="seo-form">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                <Trans>SEO</Trans>
              </h3>
              <FormFieldWrapper
                control={form.control}
                name="seo.title"
                label={<Trans>Title</Trans>}
                render={({ field }) => (
                  <Input {...field} value={field.value as string} placeholder="SEO Title" />
                )}
              />
              <FormFieldWrapper
                control={form.control}
                name="seo.description"
                label={<Trans>Description</Trans>}
                render={({ field }) => (
                  <Textarea {...field} value={field.value as string} placeholder="SEO Description" rows={3} />
                )}
              />
              <FormFieldWrapper
                control={form.control}
                name="seo.image"
                label={<Trans>Image</Trans>}
                render={() => (
                  <AssetFieldWithPicker
                    name="seo.image"
                    placeholder="Asset ID or URL"
                    dialogTitle="Select SEO Image"
                  />
                )}
              />
            </div>
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

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
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { createFaqDocument, faqDetailDocument, updateFaqDocument } from './faq.graphql.js';
import { FaqItemsBuilder } from './components/faq-items-builder.js';

const pageId = 'faq-detail';
const NEW_ENTITY_PATH = 'new';

export const faqDetail: DashboardRouteDefinition = {
  path: '/cms/faqs/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: faqDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/faqs', label: <Trans>FAQs</Trans> },
        isNew ? <Trans>New FAQ</Trans> : entity?.code,
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
      entityName: 'Faq',
      queryDocument: faqDetailDocument,
      createDocument: createFaqDocument,
      updateDocument: updateFaqDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          code: entity.code,
          active: entity.active,
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            title: translation.title || '',
            items: (translation.items || [])
              .map((item, idx) => ({
                ...item,
                index: item.index !== undefined ? item.index : idx,
              }))
              .sort((a, b) => (a.index || 0) - (b.index || 0)),
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created faq` : t`Successfully updated faq`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create faq` : t`Failed to update faq`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    // TODO: This is a hack to reset the form when the entity is loaded.
    // remove this when translations are working correctly.
    useEffect(() => {
      if (entity) {
        form.reset({
          id: entity.id,
          code: entity.code,
          active: entity.active,
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            title: translation.title || '',
            items: (translation.items || [])
              .map((item, idx) => ({
                ...item,
                index: item.index !== undefined ? item.index : idx,
              }))
              .sort((a, b) => (a.index || 0) - (b.index || 0)),
          })),
        });
      }
    }, [entity]);

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New faq</Trans> : (entity?.code ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateFaq']}>
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
              description={<Trans>When active, a faq is available in the shop</Trans>}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </PageBlock>
          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <TranslatableFormFieldWrapper
                control={form.control}
                name="title"
                label={<Trans>Title</Trans>}
                render={({ field }) => <Input {...field} value={field.value as string} />}
              />
              <FormFieldWrapper
                control={form.control}
                name="code"
                label={<Trans>Slug</Trans>}
                render={({ field }) => (
                  <SlugInput
                    {...field}
                    entityName="Faq"
                    fieldName="code"
                    watchFieldName="title"
                    entityId={entity?.id}
                  />
                )}
              />
            </DetailFormGrid>
          </PageBlock>

          <PageBlock column="main" blockId="faq-items-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="items"
              label={<Trans>FAQ Items</Trans>}
              render={({ field }) => <FaqItemsBuilder name={field.name} />}
            />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

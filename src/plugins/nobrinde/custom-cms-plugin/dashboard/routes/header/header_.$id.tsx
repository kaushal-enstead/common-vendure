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
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { createHeaderDocument, headerDetailDocument, updateHeaderDocument } from './header.graphql.js';
import { NavLinksBuilder } from './components/nav-links-builder.js';
import { AssetFieldWithPicker } from '../../shared/asset-field-with-picker.js';

const pageId = 'header-detail';
const NEW_ENTITY_PATH = 'new';

export const headerDetail: DashboardRouteDefinition = {
  path: '/cms/headers/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: headerDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/headers', label: <Trans>Headers</Trans> },
        isNew ? <Trans>New Header</Trans> : entity?.code,
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
      entityName: 'Header',
      queryDocument: headerDetailDocument,
      createDocument: createHeaderDocument,
      updateDocument: updateHeaderDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          code: entity.code,
          logo: entity.logo || '',
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            navLinks: translation.navLinks || [],
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created header` : t`Successfully updated header`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create header` : t`Failed to update header`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    // TODO: This is a hack to reset the form when the entity is loaded.
    // remove this when translations are working correctly.
    // useEffect(() => {
    //   if (entity) {
    //     form.reset({
    //       id: entity.id,
    //       code: entity.code,
    //       translations: entity.translations.map(translation => ({
    //         id: translation.id,
    //         languageCode: translation.languageCode,
    //         navLinks: translation.navLinks || [],
    //       })),
    //     });
    //   } else {
    //     const userSettingsString =
    //       typeof window !== 'undefined' && window.localStorage.getItem('vendure-user-settings');
    //     const userSettings = userSettingsString ? JSON.parse(userSettingsString) : null;

    //     form.reset({
    //       id: '',
    //       code: '',
    //       translations: [
    //         {
    //           languageCode: userSettings?.contentLanguage,
    //           navLinks: [
    //             {
    //               label: undefined,
    //               active: true,
    //               children: [],
    //               link: { label: undefined, type: 'external', openInNewTab: false, url: '', linkRef: null },
    //             },
    //           ],
    //         },
    //       ],
    //     });
    //   }
    // }, [entity]);

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New header</Trans> : (entity?.code ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateHeader']}>
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
                name="code"
                label={<Trans>Code</Trans>}
                render={({ field }) => (
                  <Input {...field} value={field.value as string} placeholder="header-code" />
                )}
              />
            </DetailFormGrid>
          </PageBlock>

          <PageBlock column="side" blockId="logo-form">
            <FormFieldWrapper
              control={form.control}
              name="logo"
              label={<Trans>Logo</Trans>}
              render={() => (
                <AssetFieldWithPicker
                  layout="vertical"
                  name="logo"
                  placeholder="Asset ID or URL"
                  dialogTitle="Select Logo"
                />
              )}
            />
          </PageBlock>

          <PageBlock column="main" blockId="nav-links-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="navLinks"
              label={<Trans>Navigation Links</Trans>}
              render={({ field }) => <NavLinksBuilder name={field.name} />}
            />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

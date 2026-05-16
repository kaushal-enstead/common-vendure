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
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { createFooterDocument, footerDetailDocument, updateFooterDocument } from './footer.graphql.js';
import { NavLinksBuilder } from './components/nav-links-builder.js';
import { SocialLinksField } from './components/social-links-field.js';
// import { LanguageCode } from '@vendure/core';

const pageId = 'footer-detail';
const NEW_ENTITY_PATH = 'new';

export const footerDetail: DashboardRouteDefinition = {
  path: '/cms/footers/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: footerDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/footers', label: <Trans>Footers</Trans> },
        isNew ? <Trans>New Footer</Trans> : entity?.code,
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
      entityName: 'Footer',
      queryDocument: footerDetailDocument,
      createDocument: createFooterDocument,
      updateDocument: updateFooterDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          code: entity.code,
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            navLinks: translation.navLinks || [],
            socialLinks: translation.socialLinks || [],
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created footer` : t`Successfully updated footer`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create footer` : t`Failed to update footer`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    // TODO: This is a hack to reset the form when the entity is loaded.
    // remove this when translations are working correctly.
    // useEffect(() => {
    //   console.log('entity', entity);
    //   if (entity) {
    //     form.reset({
    //       id: entity.id,
    //       code: entity.code,
    //       translations: entity.translations.map(translation => ({
    //         id: translation.id,
    //         languageCode: translation.languageCode,
    //         navLinks: translation.navLinks || [],
    //         socialLinks: translation.socialLinks || [],
    //       })),
    //     });
    //   } else {
    //     const userSettingsString =
    //       typeof window !== 'undefined' && window.localStorage.getItem('vendure-user-settings');
    //     const userSettings = userSettingsString ? JSON.parse(userSettingsString) : null;

    //     console.log('userSettings', userSettings);
    //     form.reset({
    //       id: '',
    //       code: '',
    //       translations: [
    //         {
    //           languageCode: userSettings?.contentLanguage ?? 'en',
    //           navLinks: [{ label: '', active: true, children: [] }],
    //           socialLinks: [{ label: '', image: '', url: '', active: true }],
    //         },
    //       ],
    //     });
    //   }
    // }, [entity]);

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New footer</Trans> : (entity?.code ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateFooter']}>
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
                  <Input {...field} value={field.value as string} placeholder="footer-code" />
                )}
              />
            </DetailFormGrid>
          </PageBlock>

          <PageBlock column="main" blockId="nav-links-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="navLinks"
              label={<Trans>Navigation Links</Trans>}
              render={({ field }) => <NavLinksBuilder name={field.name} />}
            />
          </PageBlock>

          <PageBlock column="main" blockId="social-links-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="socialLinks"
              label={<Trans>Social Links</Trans>}
              render={({ field }) => <SocialLinksField name={field.name} />}
            />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

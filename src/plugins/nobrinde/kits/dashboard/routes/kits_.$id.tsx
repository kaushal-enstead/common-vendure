import {
  AssignedFacetValues,
  Button,
  CustomFieldsPageBlock,
  DashboardRouteDefinition,
  DetailFormGrid,
  detailPageRouteLoader,
  EntityAssets,
  FormFieldWrapper,
  Input,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  RichTextInput,
  SlugInput,
  Switch,
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
// import { CreateKitVariantsDialog } from './components/create-kit-variants-dialog.js';
// import { KitVariantsTable } from './components/kit-variants-table.js';
import { createKitDocument, kitDetailDocument, updateKitDocument } from './kits.graphql.js';
import { EditKitVariantTable } from './components/edit-variant-table.js';
const pageId = 'kit-detail';
const NEW_ENTITY_PATH = 'new';

export const kitDetail: DashboardRouteDefinition = {
  path: '/kits/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: kitDetailDocument,
    breadcrumb(isNew, entity) {
      return [{ path: '/kits', label: <Trans>Kits</Trans> }, isNew ? <Trans>New kit</Trans> : entity?.name];
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
      entityName: 'Kit',
      queryDocument: kitDetailDocument,
      createDocument: createKitDocument,
      updateDocument: updateKitDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          enabled: entity.enabled,
          // discount: entity.discount,
          featuredAssetId: entity.featuredAsset?.id,
          assetIds: entity.assets.map(asset => asset.id),
          facetValueIds: entity.facetValues.map(facetValue => facetValue.id),
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            name: translation.name,
            slug: translation.slug,
            description: translation.description,
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created kit` : t`Successfully updated kit`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create kit` : t`Failed to update kit`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New kit</Trans> : (entity?.name ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateKit']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              {creatingNewEntity ? <Trans>Create</Trans> : <Trans>Update</Trans>}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="enabled-toggle">
            <FormFieldWrapper
              control={form.control}
              name="enabled"
              label={<Trans>Enabled</Trans>}
              description={<Trans>When enabled, a kit is available in the shop</Trans>}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </PageBlock>
          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <TranslatableFormFieldWrapper
                control={form.control}
                name="name"
                label={<Trans>Kit name</Trans>}
                render={({ field }) => <Input {...field} value={field.value as string} />}
              />
              <TranslatableFormFieldWrapper
                control={form.control}
                name="slug"
                label={<Trans>Slug</Trans>}
                render={({ field }) => (
                  <SlugInput
                    {...field}
                    entityName="Kit"
                    fieldName="slug"
                    watchFieldName="name"
                    entityId={entity?.id}
                  />
                )}
              />
            </DetailFormGrid>

            <TranslatableFormFieldWrapper
              control={form.control}
              name="description"
              label={<Trans>Description</Trans>}
              render={({ field }) => <RichTextInput {...field} />}
            />

            <br />
            {/* <FormFieldWrapper
              control={form.control}
              name="discount"
              label={<Trans>Discount</Trans>}
              description={<Trans>The discount percentage to apply to the kit</Trans>}
              render={({ field }) => <NumberInput {...field} />}
            /> */}
          </PageBlock>
          <CustomFieldsPageBlock column="main" entityType="Kit" control={form.control} />
          {entity && (
            <PageBlock column="main" blockId="kit-variants-table">
              <EditKitVariantTable
                kitId={entity.id}
                // registerRefresher={refresher => {
                //   refreshRef.current = refresher;
                // }}
                // fromKitDetailPage={true}
              />
            </PageBlock>
          )}
          {/* {entity && entity.variantList.totalItems > 0 && (
            <PageBlock column="main" blockId="kit-variants-table">
              <KitVariantsTable
                kitId={params.id}
                registerRefresher={refresher => {
                  refreshRef.current = refresher;
                }}
                fromKitDetailPage={true}
              />
              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline">
                  <Link to="./variants">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    <Trans>Manage variants</Trans>
                  </Link>
                </Button>
              </div>
            </PageBlock>
          )} */}

          <PageBlock column="side" blockId="facet-values" title={<Trans>Facet Values</Trans>}>
            <FormFieldWrapper
              control={form.control}
              name="facetValueIds"
              render={({ field }) => (
                <AssignedFacetValues facetValues={entity?.facetValues ?? []} {...field} />
              )}
            />
          </PageBlock>
          <PageBlock column="side" blockId="assets" title={<Trans>Assets</Trans>}>
            {/* <Field.Root>
              <Field.Control> */}
            <EntityAssets
              assets={entity?.assets}
              featuredAsset={entity?.featuredAsset}
              compact={true}
              value={form.getValues()}
              onChange={value => {
                form.setValue('featuredAssetId', value.featuredAssetId ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                form.setValue('assetIds', value.assetIds ?? [], {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            {/* </Field.Control>
              <Field.Description></Field.Description>
              <Field.Error />
            </Field.Root> */}
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

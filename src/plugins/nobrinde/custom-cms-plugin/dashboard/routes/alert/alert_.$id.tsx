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
  RichTextInput,
  EntityAssets,
  useNavigate,
  toast,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { createAlertDocument, alertDetailDocument, updateAlertDocument } from './alert.graphql.js';
import { assetFragment } from '@vendure/dashboard';
import { graphql } from '@/gql';
import { AlertButtonField } from './components/alert-button-field.js';
import { TargetUrlsField } from './components/target-urls-field.js';
import { Field } from '@base-ui/react/field';

const pageId = 'alert-detail';
const NEW_ENTITY_PATH = 'new';

const assetByIdDocument = graphql(
  `
    query AssetById($id: ID!) {
      asset(id: $id) {
        ...Asset
      }
    }
  `,
  [assetFragment],
);

export const alertDetail: DashboardRouteDefinition = {
  path: '/cms/alerts/$id',
  loader: detailPageRouteLoader({
    pageId,
    queryDocument: alertDetailDocument,
    breadcrumb(isNew, entity) {
      return [
        { path: '/cms/alerts', label: <Trans>Alerts</Trans> },
        isNew ? <Trans>New Alert</Trans> : entity?.code,
      ];
    },
  }),
  component: route => {
    const params = route.useParams();
    const navigate = useNavigate();
    const creatingNewEntity = params.id === NEW_ENTITY_PATH;
    const { t } = useLingui();
    const refreshRef = useRef<() => void>(() => {});
    const [assetPickerOpen, setAssetPickerOpen] = useState(false);

    const { form, submitHandler, entity, isPending, refreshEntity, resetForm } = useDetailPage({
      pageId,
      entityName: 'Alert',
      queryDocument: alertDetailDocument,
      createDocument: createAlertDocument,
      updateDocument: updateAlertDocument,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          code: entity.code,
          active: entity.active,
          assetId: entity.assetId || '',
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            title: translation.title || '',
            content: translation.content || '',
            targetUrls: translation.targetUrls || [],
            button: translation.button || undefined,
          })),
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast.success(creatingNewEntity ? t`Successfully created alert` : t`Successfully updated alert`);
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast.error(creatingNewEntity ? t`Failed to create alert` : t`Failed to update alert`, {
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
          assetId: entity.assetId || '',
          translations: entity.translations.map(translation => ({
            id: translation.id,
            languageCode: translation.languageCode,
            title: translation.title || '',
            content: translation.content || '',
            targetUrls: translation.targetUrls || [],
            button: translation.button || undefined,
          })),
        });
      }
    }, [entity]);

    // const asset: AssetFragment | null = entity?.asset || null;

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New alert</Trans> : (entity?.code ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateAlert']}>
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
              description={<Trans>When active, an alert is available in the shop</Trans>}
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
                    entityName="Alert"
                    fieldName="code"
                    watchFieldName="title"
                    entityId={entity?.id}
                  />
                )}
              />
            </DetailFormGrid>
          </PageBlock>

          <PageBlock column="side" blockId="assets" title={<Trans>Assets</Trans>}>
            {/* <Field.Root>
              <Field.Control> */}
            <EntityAssets
              assets={entity?.asset ? [entity?.asset] : []}
              featuredAsset={entity?.asset}
              compact={true}
              value={{
                featuredAssetId: entity?.asset?.id,
                assetIds: entity?.asset?.id ? [entity?.asset?.id] : [],
              }}
              onChange={value => {
                form.setValue('assetId', value.featuredAssetId ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                // form.setValue('assetIds', value.assetIds ?? [], {
                //   shouldDirty: true,
                //   shouldValidate: true,
                // });
              }}
            />
            {/* </Field.Control>
              <Field.Description></Field.Description>
              <Field.Error />
            </Field.Root> */}
          </PageBlock>

          {/* <PageBlock column="side" blockId="asset-form">
            <FormFieldWrapper
              control={form.control}
              name="assetId"
              label={<Trans>Asset</Trans>}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  {field.value ? (
                    <div className="flex items-center gap-3 p-3 border rounded-md">
                      {asset ? (
                        <VendureImage
                          asset={asset}
                          preset="tiny"
                          className="size-16 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="size-16 rounded-md border bg-muted flex items-center justify-center">
                          <ImageIcon className="size-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm max-w-44 font-medium truncate">
                          {asset?.name || 'Loading...'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">ID: {field.value}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAssetPickerOpen(true)}
                        >
                          <Trans>Change</Trans>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            field.onChange('');
                            form.setValue('assetId', '', { shouldDirty: true });
                          }}
                        >
                          <Trans>Clear</Trans>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setAssetPickerOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <Trans>Select Asset</Trans>
                    </Button>
                  )}
                  <AssetPickerDialog
                    open={assetPickerOpen}
                    onClose={() => setAssetPickerOpen(false)}
                    onSelect={assets => {
                      if (assets && assets.length > 0) {
                        const selectedAsset = assets[0];
                        field.onChange(selectedAsset.id);
                        form.setValue('assetId', selectedAsset.id, { shouldDirty: true });
                      }
                      setAssetPickerOpen(false);
                    }}
                    multiSelect={false}
                    title="Select Alert Asset"
                  />
                </div>
              )}
            />
          </PageBlock> */}

          <PageBlock column="main" blockId="content-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="content"
              label={<Trans>Content</Trans>}
              render={({ field }) => <RichTextInput {...field} />}
            />
          </PageBlock>

          <PageBlock column="side" blockId="target-urls-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="targetUrls"
              label={<Trans>Target URLs</Trans>}
              render={({ field }) => <TargetUrlsField name={field.name} />}
            />
          </PageBlock>

          <PageBlock column="main" blockId="button-form">
            <TranslatableFormFieldWrapper
              control={form.control}
              name="button"
              label={<Trans>Button (Optional)</Trans>}
              render={({ field }) => <AlertButtonField name={field.name} />}
            />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

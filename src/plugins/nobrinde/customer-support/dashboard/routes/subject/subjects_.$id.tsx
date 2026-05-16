import {
  Button,
  CustomFieldsPageBlock,
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
  Textarea,
  TranslatableFormFieldWrapper,
  useDetailPage,
  useNavigate,
  NEW_ENTITY_PATH,
  toast,
} from '@vendure/dashboard';
import {
  createSupportSubjectDocument,
  supportSubjectDetailDocument,
  updateSupportSubjectDocument,
} from './subjects.graphql';
import { Trans, useLingui } from '@lingui/react/macro';

const pageId = 'subject-detail';

export const supportSubjectDetail: DashboardRouteDefinition = {
  path: '/support-subjects/$id',
  loader: detailPageRouteLoader({
    queryDocument: supportSubjectDetailDocument,
    breadcrumb: (isNew, entity) => [
      { path: '/support-subjects', label: 'Subjects' },
      isNew ? 'New subject' : entity?.name,
    ],
  }),
  component: route => {
    const params = route.useParams();
    const navigate = useNavigate();
    const creatingNewEntity = params.id === NEW_ENTITY_PATH;
    const { i18n } = useLingui();

    const { form, submitHandler, entity, isPending, resetForm } = useDetailPage({
      pageId,
      queryDocument: supportSubjectDetailDocument,
      createDocument: createSupportSubjectDocument,
      updateDocument: updateSupportSubjectDocument,
      setValuesForUpdate: subject => {
        return {
          id: subject?.id ?? '',
          isActive: subject?.isActive ?? true,
          code: subject?.code ?? '',
          translations:
            subject?.translations?.map(t => ({
              id: t.id,
              languageCode: t.languageCode,
              name: t.name,
              description: t.description,
            })) ?? [],
        };
      },
      // transformCreateInput: values => {
      //   return {
      //     ...values,
      //   };
      // },
      params: { id: params.id },
      onSuccess: async data => {
        toast(i18n.t(creatingNewEntity ? 'Successfully created subject' : 'Successfully updated subject'));
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast(i18n.t(creatingNewEntity ? 'Failed to create subject' : 'Failed to update subject'), {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New subject</Trans> : (entity?.name ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateSupportSubject']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              {creatingNewEntity ? <Trans>Create</Trans> : <Trans>Update</Trans>}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="active-status">
            <FormFieldWrapper
              control={form.control}
              name="isActive"
              label={<Trans>Is Active</Trans>}
              description={<Trans>Active subjects are visible in the shop</Trans>}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </PageBlock>
          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="code"
                label={<Trans>Code</Trans>}
                render={({ field }) => <Input {...field} />}
              />
              <TranslatableFormFieldWrapper
                control={form.control}
                name="name"
                label={<Trans>Name</Trans>}
                render={({ field }) => <Input {...(field as any)} />}
              />
            </DetailFormGrid>
            <TranslatableFormFieldWrapper
              control={form.control}
              name="description"
              label={<Trans>Description</Trans>}
              render={({ field }) => <Textarea {...(field as any)} />}
            />
          </PageBlock>
          <CustomFieldsPageBlock column="main" entityType="SupportSubject" control={form.control} />
        </PageLayout>
      </Page>
    );
  },
};

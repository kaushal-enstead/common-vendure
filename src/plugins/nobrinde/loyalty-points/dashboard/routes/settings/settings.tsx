import {
  Button,
  DashboardRouteDefinition,
  DetailFormGrid,
  extendDetailFormQuery,
  FormFieldWrapper,
  getDetailQueryOptions,
  NumberInput,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  Switch,
  useDetailPage,
  useNavigate,
  toast,
  NEW_ENTITY_PATH,
} from '@vendure/dashboard';
import { getLoyaltySettings, updateLoyaltySettingsDocument } from './settings.graphql';
import { Trans, useLingui } from '@lingui/react/macro';

const pageId = 'loyalty-points-settings';

export const loyaltyPointsSettings: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'loyalty-points',
    id: 'loyalty-points-settings',
    url: '/loyalty-points-settings',
    title: 'Settings',
  },
  path: '/loyalty-points-settings',
  // loader: detailPageRouteLoader({
  //   queryDocument: getLoyaltySettings,
  //   breadcrumb: (isNew, entity) => [
  //     { path: '/loyalty-points-settings', label: 'Settings' },
  //     // isNew ? 'New subject' : entity?.name,
  //   ],
  //   pageId,
  // }),
  loader: async ({ context }) => {
    const { extendedQuery: extendedQueryDocument } = extendDetailFormQuery(getLoyaltySettings, pageId);
    await context.queryClient.ensureQueryData(getDetailQueryOptions(extendedQueryDocument, { id: '' }), {});
    return {
      breadcrumb: [{ path: '/loyalty-points-settings', label: <Trans>Settings</Trans> }],
    };
  },
  component: route => {
    const params = route.useParams();
    const navigate = useNavigate();
    const creatingNewEntity = params.id === NEW_ENTITY_PATH;
    const { i18n } = useLingui();

    const { form, submitHandler, entity, isPending, resetForm } = useDetailPage({
      pageId,
      queryDocument: getLoyaltySettings,
      updateDocument: updateLoyaltySettingsDocument,
      setValuesForUpdate: setting => {
        return {
          pointsPerEuro: setting?.pointsPerEuro ?? 0,
          maxRedeemablePoints: setting?.maxRedeemablePoints ?? 0,
          enableLoyaltyDiscount: setting?.enableLoyaltyDiscount ?? false,
          loyaltyDiscount: setting?.loyaltyDiscount ?? 0,
        };
      },
      transformCreateInput: values => {
        return {
          ...values,
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast(
          i18n.t(
            creatingNewEntity
              ? 'Successfully created loyalty points settings'
              : 'Successfully updated loyalty points settings',
          ),
        );
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast(
          i18n.t(
            creatingNewEntity
              ? 'Failed to create loyalty points settings'
              : 'Failed to update loyalty points settings',
          ),
          {
            description: err instanceof Error ? err.message : 'Unknown error',
          },
        );
      },
    });

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>
          <Trans>Loyalty points settings</Trans>
        </PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateLoyaltyPoints']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              <Trans>Update</Trans>
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="loyalty-flag">
            <FormFieldWrapper
              control={form.control}
              name="enableLoyaltyDiscount"
              label={<Trans>Enable Loyalty Discount</Trans>}
              description={<Trans>Enable loyalty discount for customers</Trans>}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </PageBlock>
          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="pointsPerEuro"
                label={<Trans>Currency to Point Conversion</Trans>}
                description={<Trans>How many points per euro</Trans>}
                render={({ field }) => <NumberInput {...field} />}
              />
              <FormFieldWrapper
                control={form.control}
                name="maxRedeemablePoints"
                label={<Trans>Max Points Redeemable at Once</Trans>}
                description={
                  <Trans>Maximum number of points that can be redeemed in a single transaction</Trans>
                }
                render={({ field }) => <NumberInput {...field} />}
              />
            </DetailFormGrid>

            <FormFieldWrapper
              control={form.control}
              name="loyaltyDiscount"
              label={<Trans>Loyalty Discount (%)</Trans>}
              description={
                <Trans>
                  This discount % will be applied per item when the customer redeems the minimum required
                  loyalty points.
                </Trans>
              }
              render={({ field }) => <NumberInput {...field} />}
            />
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

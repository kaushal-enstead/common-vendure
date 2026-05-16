import { Trans, useLingui } from '@lingui/react/macro';
import { ResultOf } from 'gql.tada';
import { User } from 'lucide-react';
import { CustomerAddressSelector } from './components/customer-address-selector';
import { EditBudgetTable } from './components/edit-budget-table';
import { OrderAddress } from './components/order-address';
import { BudgetMessages } from './components/budget-messages';
import {
  addItemToBudgetOrderDocument,
  adjustBudgetOrderLineDocument,
  applyCouponCodeToBudgetOrderDocument,
  deleteBudgetOrderDocument,
  budgetDetailDocument,
  removeCouponCodeFromBudgetOrderDocument,
  removeBudgetOrderLineDocument,
  setBillingAddressForBudgetOrderDocument,
  setCustomerForBudgetOrderDocument,
  setShippingAddressForBudgetOrderDocument,
  unsetBillingAddressForBudgetOrderDocument,
  unsetShippingAddressForBudgetOrderDocument,
  modifyBudgetDocument,
} from './budgets.graphql';
import {
  DashboardRouteDefinition,
  detailPageRouteLoader,
  ConfirmationDialog,
  CustomerSelector,
  PermissionGuard,
  Button,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  useDetailPage,
  api,
  Badge,
  BadgeProps,
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
  useMutation,
  Link,
  useNavigate,
  toast,
} from '@vendure/dashboard';
const pageId = 'budget-detail';

export const budgetDetail: DashboardRouteDefinition = {
  path: '/budgets/$id',
  loader: detailPageRouteLoader({
    queryDocument: budgetDetailDocument,
    breadcrumb: (isNew, entity) => [
      { path: '/budgets', label: 'Budgets' },
      isNew ? 'New budget' : (entity?.code ?? ''),
    ],
  }),
  component: route => {
    const params = route.useParams();
    const { t } = useLingui();
    const navigate = useNavigate();

    const { entity, refreshEntity, form } = useDetailPage({
      queryDocument: budgetDetailDocument,
      pageId,
      setValuesForUpdate: entity => {
        return {
          id: entity.id,
          // customFields: entity.customFields,
        };
      },
      params: { id: params.id },
    });

    const { mutate: addItemToBudgetOrder } = useMutation({
      mutationFn: api.mutate(addItemToBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof addItemToBudgetOrderDocument>) => {
        const budget = result.addItemToBudgetOrder;
        switch (budget.__typename) {
          case 'Budget':
            toast.success(t`Item added to budget`);
            refreshEntity();
            break;
          default:
            toast.error(budget.message);
            break;
        }
      },
      onError: error => {
        if ((error as any).extensions?.code === 'ENTITY_NOT_FOUND') {
          toast.error(t`The variant could not be added. Ensure the parent product is enabled.`);
        }
      },
    });

    const { mutate: adjustBudgetOrderLine } = useMutation({
      mutationFn: api.mutate(adjustBudgetOrderLineDocument),
      onSuccess: (result: ResultOf<typeof adjustBudgetOrderLineDocument>) => {
        const budget = result.adjustBudgetOrderLine;
        switch (budget.__typename) {
          case 'Budget':
            toast.success(t`Budget line updated`);
            refreshEntity();
            break;
          default:
            toast.error(budget.message);
            break;
        }
      },
    });

    const { mutate: removeBudgetOrderLine } = useMutation({
      mutationFn: api.mutate(removeBudgetOrderLineDocument),
      onSuccess: (result: ResultOf<typeof removeBudgetOrderLineDocument>) => {
        const budget = result.removeBudgetOrderLine;
        switch (budget.__typename) {
          case 'Budget':
            toast.success(t`Budget line removed`);
            refreshEntity();
            break;
          default:
            toast.error(budget.message);
            break;
        }
      },
    });

    const { mutate: setCustomerForBudgetOrder } = useMutation({
      mutationFn: api.mutate(setCustomerForBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof setCustomerForBudgetOrderDocument>) => {
        const budget = result.setCustomerForBudgetOrder;
        switch (budget.__typename) {
          case 'Budget':
            toast.success(t`Customer set for budget`);

            // When we change the customer, we should clear
            // any selected shipping/billing address
            if (entity?.shippingAddress) {
              unsetShippingAddressForBudgetOrder({ budgetId: entity.id });
            }
            if (entity?.billingAddress) {
              unsetBillingAddressForBudgetOrder({ budgetId: entity.id });
            }
            refreshEntity();
            break;
          default:
            toast.error(budget.message);
            break;
        }
      },
    });

    const { mutate: setShippingAddressForBudgetOrder } = useMutation({
      mutationFn: api.mutate(setShippingAddressForBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof setShippingAddressForBudgetOrderDocument>) => {
        toast.success(t`Shipping address set for budget`);
        refreshEntity();
      },
    });

    const { mutate: setBillingAddressForBudgetOrder } = useMutation({
      mutationFn: api.mutate(setBillingAddressForBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof setBillingAddressForBudgetOrderDocument>) => {
        toast.success(t`Billing address set for budget`);
        refreshEntity();
      },
    });

    const { mutate: unsetShippingAddressForBudgetOrder } = useMutation({
      mutationFn: api.mutate(unsetShippingAddressForBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof unsetShippingAddressForBudgetOrderDocument>) => {
        toast.success(t`Shipping address unset for budget`);
        refreshEntity();
      },
    });

    const { mutate: unsetBillingAddressForBudgetOrder } = useMutation({
      mutationFn: api.mutate(unsetBillingAddressForBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof unsetBillingAddressForBudgetOrderDocument>) => {
        toast.success(t`Billing address unset for budget`);
        refreshEntity();
      },
    });

    const { mutate: setCouponCodeForBudgetOrder } = useMutation({
      mutationFn: api.mutate(applyCouponCodeToBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof applyCouponCodeToBudgetOrderDocument>) => {
        const budget = result.applyCouponCodeToBudgetOrder;
        switch (budget.__typename) {
          case 'Budget':
            toast.success(t`Coupon code set for budget`);
            refreshEntity();
            break;
          default:
            toast.error(budget.message);
            break;
        }
      },
    });

    const { mutate: removeCouponCodeForBudgetOrder } = useMutation({
      mutationFn: api.mutate(removeCouponCodeFromBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof removeCouponCodeFromBudgetOrderDocument>) => {
        toast.success(t`Coupon code removed from budget`);
        refreshEntity();
      },
    });

    const { mutate: deleteBudgetOrder } = useMutation({
      mutationFn: api.mutate(deleteBudgetOrderDocument),
      onSuccess: (result: ResultOf<typeof deleteBudgetOrderDocument>) => {
        if (result.deleteBudgetOrder.result === 'DELETED') {
          toast.success(t`Budget order deleted`);
          navigate({ to: '/budgets' });
        } else {
          toast.error(result.deleteBudgetOrder.message);
        }
      },
    });

    const { mutate: modifyBudget } = useMutation({
      mutationFn: api.mutate(modifyBudgetDocument),
      onSuccess: (result: ResultOf<typeof modifyBudgetDocument>) => {
        toast.success(t`Budget order modified`);
        refreshEntity();
      },
    });

    if (!entity) {
      return null;
    }

    const variantMap: Record<string, BadgeProps['variant']> = {
      Pending: 'outline',
      Accepted: 'success',
      Rejected: 'destructive',
      ChangesRequested: 'default',
    };

    return (
      <Page pageId="budget-order-detail" form={form}>
        <PageTitle>
          <div className="flex items-center gap-4">
            {/* <Trans>Budget order</Trans>:  */}
            {entity?.code ?? ''}
            <Badge variant={variantMap[entity?.state ?? 'Pending'] ?? 'outline'}>
              <Trans>{entity?.state}</Trans>
            </Badge>
          </div>
        </PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="budget-state-selector">
            <div className="flex items-center gap-2">
              <Select
                value={entity.state}
                onValueChange={value => modifyBudget({ budgetId: entity.id, input: { state: value ?? '' } })}
                items={[
                  { label: 'Pending', value: 'Pending' },
                  { label: 'Accepted', value: 'Accepted' },
                  { label: 'Rejected', value: 'Rejected' },
                  { label: 'ChangesRequested', value: 'ChangesRequested' },
                ]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="ChangesRequested">ChangesRequested</SelectItem>
                </SelectContent>
              </Select>

              <PermissionGuard requires={['DeleteBudget']}>
                <ConfirmationDialog
                  title={t`Delete budget`}
                  description={t`Are you sure you want to delete this budget?`}
                  onConfirm={() => {
                    deleteBudgetOrder({ budgetId: entity.id });
                  }}
                >
                  <Button variant="destructive" type="button">
                    <Trans>Delete budget</Trans>
                  </Button>
                </ConfirmationDialog>
              </PermissionGuard>
              {/* <PermissionGuard requires={['UpdateBudget']}>
            <Button
              type="button"
              disabled={
                !entity.customer ||
                entity.lines.length === 0 ||
                entity.shippingLines.length === 0 ||
                entity.state !== 'Draft'
              }
              onClick={() => completeDraftOrder({ id: entity.id, state: 'ArrangingPayment' })}
            >
              <Trans>Complete draft</Trans>
            </Button>
          </PermissionGuard> */}
            </div>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="main" blockId="budget-table">
            <EditBudgetTable
              budget={entity}
              onAddItem={e =>
                addItemToBudgetOrder({
                  budgetId: entity.id,
                  input: { productVariantId: e.productVariantId, quantity: 1 },
                })
              }
              onAdjustLine={e =>
                adjustBudgetOrderLine({
                  budgetId: entity.id,
                  input: {
                    orderLineId: e.budgetLineId,
                    quantity: e.quantity,
                    // customFields: e.customFields,
                  },
                })
              }
              onRemoveLine={e =>
                removeBudgetOrderLine({
                  budgetId: entity.id,
                  budgetLineId: e.lineId,
                })
              }
              onApplyCouponCode={e =>
                setCouponCodeForBudgetOrder({
                  budgetId: entity.id,
                  couponCode: e.couponCode,
                })
              }
              onRemoveCouponCode={e =>
                removeCouponCodeForBudgetOrder({
                  budgetId: entity.id,
                  couponCode: e.couponCode,
                })
              }
            />
          </PageBlock>
          <PageBlock column="main" blockId="budget-messages" title={<Trans>Budget messages</Trans>}>
            <BudgetMessages budgetId={entity.id} />
          </PageBlock>
          {/* <PageBlock column="main" blockId="order-custom-fields" title={<Trans>Custom fields</Trans>}>
          <Form {...orderCustomFieldsForm}>
            <CustomFieldsForm
              entityType="Budget"
              control={orderCustomFieldsForm.control}
              formPathPrefix="input"
            />
            <div className="mt-4">
              <Button
                type="submit"
                className=""
                disabled={
                  !orderCustomFieldsForm.formState.isValid || !orderCustomFieldsForm.formState.isDirty
                }
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSaveCustomFields(orderCustomFieldsForm.getValues());
                }}
              >
                <Trans>Set custom fields</Trans>
              </Button>
            </div>
          </Form>
        </PageBlock> */}
          <PageBlock column="side" blockId="customer" title={<Trans>Customer</Trans>}>
            {entity?.customer?.id ? (
              <Button
                variant="outline"
                className="mb-4"
                render={<Link to={`/customers/${entity?.customer?.id}`} />}
              >
                <User className="w-4 h-4" />
                {entity?.customer?.firstName} {entity?.customer?.lastName}
              </Button>
            ) : null}
            <CustomerSelector
              onSelect={customer => {
                setCustomerForBudgetOrder({ budgetId: entity.id, customerId: customer.id });
              }}
            />
          </PageBlock>
          <PageBlock column="side" blockId="shipping-address" title={<Trans>Shipping address</Trans>}>
            <div className="flex flex-col">
              <OrderAddress address={entity.shippingAddress ?? undefined} />
              {entity.shippingAddress?.streetLine1 ? (
                <RemoveAddressButton
                  onClick={() => unsetShippingAddressForBudgetOrder({ budgetId: entity.id })}
                />
              ) : (
                <div className="mt-4">
                  <CustomerAddressSelector
                    customerId={entity.customer?.id}
                    onSelect={address => {
                      setShippingAddressForBudgetOrder({
                        budgetId: entity.id,
                        input: {
                          fullName: address.fullName,
                          company: address.company,
                          streetLine1: address.streetLine1,
                          streetLine2: address.streetLine2,
                          city: address.city,
                          province: address.province,
                          postalCode: address.postalCode,
                          countryCode: address.country.code,
                          phoneNumber: address.phoneNumber,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </PageBlock>
          <PageBlock column="side" blockId="billing-address" title={<Trans>Billing address</Trans>}>
            <div className="flex flex-col">
              <OrderAddress address={entity.billingAddress ?? undefined} />
              {entity.billingAddress?.streetLine1 ? (
                <RemoveAddressButton
                  onClick={() => unsetBillingAddressForBudgetOrder({ budgetId: entity.id })}
                />
              ) : (
                <div className="mt-4">
                  <CustomerAddressSelector
                    customerId={entity.customer?.id}
                    onSelect={address => {
                      setBillingAddressForBudgetOrder({
                        budgetId: entity.id,
                        input: {
                          fullName: address.fullName,
                          company: address.company,
                          streetLine1: address.streetLine1,
                          streetLine2: address.streetLine2,
                          city: address.city,
                          province: address.province,
                          postalCode: address.postalCode,
                          countryCode: address.country.code,
                          phoneNumber: address.phoneNumber,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

const RemoveAddressButton = (props: { onClick: () => void }) => {
  return (
    <div className="">
      <Button variant="outline" className="mt-4" size="sm" onClick={props.onClick}>
        <Trans>Remove</Trans>
      </Button>
    </div>
  );
};

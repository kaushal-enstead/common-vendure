import {
  Button,
  DashboardRouteDefinition,
  FormFieldWrapper,
  NumberInput,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  RefreshButton,
  useNavigate,
  toast,
  PermissionGuard,
  useForm,
  useMutation,
  useQuery,
} from '@vendure/dashboard';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import TreeComponent from './components/customers-tree';
import { api } from '@vendure/dashboard';
import { allocateLoyaltyPoints, getCustomerGroups } from './allocator.graphql';
import { Trans } from '@lingui/react/macro';

type Tree = {
  id: string;
  name: string;
  children: Tree[];
};

type Item = {
  name: string;
  children: string[];
};
const pageId = 'loyalty-points-allocator';

const schema = z.object({
  points: z.number().min(10, 'Points must be greater than 10'),
  customerIds: z.array(z.string()).min(1),
});

export const loyaltyPointsAllocator: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'loyalty-points',
    id: 'loyalty-points-allocator',
    url: '/loyalty-points-allocator',
    title: 'Allocator',
  },
  path: '/loyalty-points-allocator',
  loader: () => ({
    breadcrumb: 'Allocator',
  }),
  component: route => {
    const navigate = useNavigate();
    const { data, isPending, error, refetch } = useQuery({
      queryKey: ['customerGroups'],
      queryFn: () => api.query(getCustomerGroups),
      select: data => {
        // Transform the array of groups into a Record<string, Item>
        const groups = data.getCustomerGroups as Tree[];
        const record: Record<string, Item> = {};
        groups.forEach(group => {
          record[group.id] = {
            name: group.name,
            children: group.children?.map(child => child.id) ?? [],
          };
          // Also add children as items
          group.children?.forEach(child => {
            record[child.id] = {
              name: child.name,
              children: [],
            };
          });
        });
        // Optionally, add a root node if needed
        record['root'] = {
          name: 'Root',
          children: groups.map(group => group.id),
        };
        return record;
      },
    });
    const { mutate } = useMutation({
      mutationFn: (data: z.infer<typeof schema>) => {
        return api.mutate(allocateLoyaltyPoints, { input: data });
      },
      onSuccess: () => {
        form.reset();
        toast.success('Loyalty points allocated successfully');
      },
      onError: () => {
        toast.error('Failed to allocate loyalty points');
      },
    });
    const form = useForm({
      resolver: zodResolver(schema),
      mode: 'onChange',
      defaultValues: {
        points: 0,
        customerIds: [],
      },
    });

    const onSubmit: SubmitHandler<z.infer<typeof schema>> = (data, event) => {
      event?.stopPropagation();
      event?.preventDefault();
      mutate(data);
    };

    return (
      <Page pageId={pageId} form={form} submitHandler={form.handleSubmit(onSubmit)}>
        <PageTitle>
          <Trans>Loyalty points allocator</Trans>
        </PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="allocate-loyalty-points">
            <RefreshButton onRefresh={() => refetch()} isLoading={isPending ?? false} />
            <PermissionGuard requires={['UpdateLoyaltyPoints']}>
              <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid}>
                <Trans>Allocate</Trans>
              </Button>
            </PermissionGuard>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="points-allocator">
            <FormFieldWrapper
              control={form.control}
              name="points"
              label={<Trans>Points</Trans>}
              description={<Trans>Points to allocate</Trans>}
              render={({ field }) => <NumberInput {...field} />}
            />
          </PageBlock>
          <PageBlock column="main" blockId="customers-allocator">
            {/* <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="customerId"
                label={<Trans>Max Points Redeemable at Once</Trans>}
                render={({ field }) => <Input {...field} />}
              />
            </DetailFormGrid> */}
            {data && (
              <TreeComponent
                data={data}
                onStateChange={state => {
                  if (state.checkedItems) {
                    form.setValue(
                      'customerIds',
                      state.checkedItems.filter(i => !i.includes('group-')),
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      },
                    );
                  }
                }}
              />
            )}
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

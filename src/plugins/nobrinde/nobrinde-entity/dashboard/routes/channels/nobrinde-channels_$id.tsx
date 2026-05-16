import {
  DashboardRouteDefinition,
  DetailFormGrid,
  detailPageRouteLoader,
  FormFieldWrapper,
  Input,
  Page,
  PageActionBar,
  PageActionBarRight,
  PageBlock,
  PageLayout,
  PageTitle,
  useDetailPage,
  useForm,
} from '@vendure/dashboard';
import { NobrindeChannelDetailSyncButton } from '../../../../external-sync/dashboard/components/nobrinde-channel-detail-sync-button';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { nobrindeChannelDetailDocument } from './nobrinde-channels.graphql';

const pageId = 'nobrinde-channel-detail';

type ChannelFormValues = {
  id: string;
  createdAt: string;
  updatedAt: string;
  channel_type: string;
  config_json: string;
  created_by: string;
  date_created: string;
  date_updated: string;
  is_active: boolean;
  name: string;
  slug: string;
  updated_by: string;
};

export const nobrindeChannelDetail: DashboardRouteDefinition = {
  path: '/nobrinde/channels/$id',
  loader: detailPageRouteLoader({
    queryDocument: nobrindeChannelDetailDocument,
    breadcrumb: (_isNew, entity) => [
      { path: '/nobrinde/channels', label: 'Channels' },
      entity ? ((entity as { name?: string }).name ?? `#${(entity as { id?: number }).id}`) : '',
    ],
  }),
  component: route => {
    const params = route.useParams();
    const { entity } = useDetailPage({
      queryDocument: nobrindeChannelDetailDocument,
      pageId,
      setValuesForUpdate: () => ({}),
      params: { id: params.id },
    });

    const form = useForm<ChannelFormValues>({
      defaultValues: {
        id: '',
        createdAt: '',
        updatedAt: '',
        channel_type: '',
        config_json: '',
        created_by: '',
        date_created: '',
        date_updated: '',
        is_active: false,
        name: '',
        slug: '',
        updated_by: '',
      },
    });

    useEffect(() => {
      if (entity) {
        const u = entity as ChannelFormValues & { date_created?: string; date_updated?: string };
        form.reset({
          id: u.id ?? '',
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '',
          channel_type: u.channel_type ?? '',
          config_json: u.config_json ?? '',
          created_by: u.created_by ?? '',
          date_created: u.date_created ? new Date(u.date_created).toLocaleString() : '',
          date_updated: u.date_updated ? new Date(u.date_updated).toLocaleString() : '',
          is_active: u.is_active ?? false,
          name: u.name ?? '',
          slug: u.slug ?? '',
          updated_by: u.updated_by ?? '',
        });
      }
    }, [entity, form]);

    if (!entity) {
      return null;
    }

    const channel = entity as ChannelFormValues & { name?: string };
    const displayName = channel.name ?? `Channel #${channel.id}`;

    const readOnlyInput = (field: { value: string | number | boolean }) => (
      <Input value={field.value != null ? String(field.value) : ''} readOnly className="cursor-not-allowed" />
    );

    const submitHandler = (e: React.FormEvent) => e.preventDefault();

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{displayName}</PageTitle>
        <PageActionBar>
          <PageActionBarRight>
            <NobrindeChannelDetailSyncButton entityId={channel.id} />
          </PageActionBarRight>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="record-info" title={<Trans>Record info</Trans>}>
            <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="id"
                label={<Trans>Internal ID</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="createdAt"
                label={<Trans>Created</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="updatedAt"
                label={<Trans>Last updated</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
            </DetailFormGrid>
          </PageBlock>

          <PageBlock column="main" blockId="main-form">
            <DetailFormGrid>
              <FormFieldWrapper
                control={form.control}
                name="channel_type"
                label={<Trans>Channel type</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="name"
                label={<Trans>Name</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="slug"
                label={<Trans>Slug</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="is_active"
                label={<Trans>Active</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="created_by"
                label={<Trans>Created by</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="date_created"
                label={<Trans>Date created</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="updated_by"
                label={<Trans>Updated by</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="date_updated"
                label={<Trans>Date updated</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="config_json"
                label={<Trans>Config (JSON)</Trans>}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ''}
                    readOnly
                    className="cursor-not-allowed font-mono text-sm"
                  />
                )}
              />
            </DetailFormGrid>
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

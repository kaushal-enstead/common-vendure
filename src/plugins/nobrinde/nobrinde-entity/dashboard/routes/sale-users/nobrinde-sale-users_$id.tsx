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
import { NobrindeSaleUserDetailSyncButton } from '../../../../external-sync/dashboard/components/nobrinde-sale-user-detail-sync-button';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { nobrindeSaleUserDetailDocument } from './nobrinde-sale-users.graphql';

const pageId = 'nobrinde-sale-user-detail';

type SaleUserFormValues = {
  id_vendedor: number;
  sigla: string;
  nome: string;
  telefone: string;
  telemovel: string;
  email: string;
  id: string;
  createdAt: string;
  updatedAt: string;
};

export const nobrindeSaleUserDetail: DashboardRouteDefinition = {
  path: '/nobrinde/sale-users/$id',
  loader: detailPageRouteLoader({
    queryDocument: nobrindeSaleUserDetailDocument,
    breadcrumb: (_isNew, entity) => [
      { path: '/nobrinde/sale-users', label: 'Sale users' },
      entity ? (entity.nome ?? entity.sigla ?? `#${entity.id_vendedor}`) : '',
    ],
  }),
  component: route => {
    const params = route.useParams();
    const { entity } = useDetailPage({
      queryDocument: nobrindeSaleUserDetailDocument,
      pageId,
      setValuesForUpdate: () => ({}),
      params: { id: params.id },
    });

    const form = useForm<SaleUserFormValues>({
      defaultValues: {
        id_vendedor: 0,
        sigla: '',
        nome: '',
        telefone: '',
        telemovel: '',
        email: '',
        id: '',
        createdAt: '',
        updatedAt: '',
      },
    });

    useEffect(() => {
      if (entity) {
        const u = entity;
        form.reset({
          id_vendedor: u.id_vendedor ?? 0,
          sigla: u.sigla ?? '',
          nome: u.nome ?? '',
          telefone: u.telefone ?? '',
          telemovel: u.telemovel ?? '',
          email: u.email ?? '',
          id: u.id ?? '',
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '',
        });
      }
    }, [entity, form]);

    if (!entity) {
      return null;
    }

    const user = entity;
    const displayName = user.nome ?? user.sigla ?? `Sale user #${user.id_vendedor}`;

    const readOnlyInput = (field: { value: string | number }) => (
      <Input
        value={field.value != null ? String(field.value) : ''}
        readOnly
        // disabled
        className="cursor-not-allowed"
      />
    );

    const submitHandler = (e: React.FormEvent) => e.preventDefault();

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{displayName}</PageTitle>
        <PageActionBar>
          <PageActionBarRight>
            <NobrindeSaleUserDetailSyncButton entityId={user.id} />
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
                name="id_vendedor"
                label={<Trans>Seller ID (id_vendedor)</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="sigla"
                label={<Trans>Code (sigla)</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="nome"
                label={<Trans>Name</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="telefone"
                label={<Trans>Phone (telefone)</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="telemovel"
                label={<Trans>Mobile (telemovel)</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
              <FormFieldWrapper
                control={form.control}
                name="email"
                label={<Trans>Email</Trans>}
                render={({ field }) => readOnlyInput(field)}
              />
            </DetailFormGrid>
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

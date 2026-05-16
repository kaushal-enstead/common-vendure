import { Trans } from '@lingui/react/macro';
import { nobrindeOrderDetailDocument } from './nobrinde-orders.graphql';
import {
  DashboardRouteDefinition,
  DetailPageButton,
  detailPageRouteLoader,
  Money,
  Page,
  PageActionBar,
  PageActionBarRight,
  PageBlock,
  PageLayout,
  PageTitle,
  useDetailPage,
  VendureImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@vendure/dashboard';
import { NobrindeOrderDetailSyncButton } from '../../../../external-sync/dashboard/components/nobrinde-order-detail-sync-button';

const pageId = 'nobrinde-order-detail';

export const nobrindeOrderDetail: DashboardRouteDefinition = {
  path: '/nobrinde/orders/$id',
  loader: detailPageRouteLoader({
    queryDocument: nobrindeOrderDetailDocument,
    breadcrumb: (isNew, entity) => [
      { path: '/nobrinde/orders', label: 'Orders' },
      isNew ? 'New' : entity ? `#${entity.id_phc}` : '',
    ],
  }),
  component: route => {
    const params = route.useParams();
    const { entity } = useDetailPage({
      queryDocument: nobrindeOrderDetailDocument,
      pageId,
      setValuesForUpdate: () => ({}),
      params: { id: params.id },
    });

    if (!entity) {
      return null;
    }

    const order = entity;
    const lines = order.lines ?? [];

    return (
      <Page pageId={pageId}>
        <PageTitle>
          <Trans>Nobrinde Order</Trans>: #{order.id_phc}
          {order.data_documento ? ` – ${order.data_documento}` : ''}
        </PageTitle>
        <PageActionBar>
          <PageActionBarRight>
            <NobrindeOrderDetailSyncButton entityId={order.id} />
          </PageActionBarRight>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="main" blockId="nobrinde-order-header" title={<Trans>Order</Trans>}>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">ID (PHC)</dt>
                <dd>{order.id_phc}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Document date</dt>
                <dd>{order.data_documento ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Company</dt>
                <dd>{order.empresa ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">NIF</dt>
                <dd>{order.nif ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Address</dt>
                <dd>{order.morada ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Locality</dt>
                <dd>{order.localidade ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Postal code</dt>
                <dd>{order.c_postal ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Entity #</dt>
                <dd>{order.nr_entidade ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Total (liquid)</dt>
                <dd>{order.total_liq != null ? order.total_liq : '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Total</dt>
                <dd>{order.total != null ? order.total : '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">IVA</dt>
                <dd>{order.iva != null ? order.iva : '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Tracking</dt>
                <dd>{order.tracking ?? '–'}</dd>
              </div>
            </dl>
          </PageBlock>
          <PageBlock column="main" blockId="nobrinde-order-lines" title={<Trans>Lines</Trans>}>
            {lines.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                <Trans>No lines</Trans>
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Trans>Order</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Reference</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Product</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Qty</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Unit price</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Discount</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Total</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>State</Trans>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell>{line.ordem ?? '–'}</TableCell>
                      <TableCell>{line.referencia ?? line.referencia_externa ?? '–'}</TableCell>
                      <TableCell>
                        {line.productVariant ? (
                          <div className="flex items-center gap-2">
                            <VendureImage asset={line.productVariant.featuredAsset} preset="tiny" />
                            <div className="min-w-0">
                              <DetailPageButton
                                href={`/dashboard/product-variants/${line.productVariant.id}`}
                                label={line.productVariant.name ?? line.nome_produto ?? line.productVariant.sku}
                                search={undefined}
                              />
                              <div className="text-xs text-muted-foreground">{line.productVariant.sku}</div>
                            </div>
                          </div>
                        ) : (
                          line.nome_produto ?? '–'
                        )}
                      </TableCell>
                      <TableCell>{line.qtdd ?? '–'}</TableCell>
                      <TableCell>
                        {line.productVariant?.priceWithTax != null ? (
                          <Money
                            value={line.productVariant.priceWithTax}
                            currency={line.productVariant.currencyCode}
                          />
                        ) : line.preco_unit != null ? (
                          line.preco_unit
                        ) : (
                          '–'
                        )}
                      </TableCell>
                      <TableCell>{line.desc != null ? line.desc : '–'}</TableCell>
                      <TableCell>{line.total != null ? line.total : '–'}</TableCell>
                      <TableCell>{line.estado ?? '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PageBlock>
        </PageLayout>
      </Page>
    );
  },
};

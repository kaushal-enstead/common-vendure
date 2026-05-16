import { Trans } from '@lingui/react/macro';
import { FileDown, FileText } from 'lucide-react';
import { api, useMutation, useQueryClient, toast } from '@vendure/dashboard';
import {
  Button,
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
import { generateNobrindeBudgetPdfDocument, nobrindeBudgetDetailDocument } from './nobrinde-budgets.graphql';
import { NobrindeBudgetDetailSyncButton } from '../../../../external-sync/dashboard/components/nobrinde-budget-detail-sync-button';

const pageId = 'nobrinde-budget-detail';

function getAssetDownloadUrl(source: string): string {
  if (source.startsWith('http')) return source;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/assets/${source}`;
}

export const nobrindeBudgetDetail: DashboardRouteDefinition = {
  path: '/nobrinde/budgets/$id',
  loader: detailPageRouteLoader({
    queryDocument: nobrindeBudgetDetailDocument,
    breadcrumb: (isNew, entity) => [
      { path: '/nobrinde/budgets', label: 'Budgets' },
      isNew ? 'New' : entity ? `#${entity.id_phc}` : '',
    ],
  }),
  component: route => {
    const params = route.useParams();
    const { entity } = useDetailPage({
      queryDocument: nobrindeBudgetDetailDocument,
      pageId,
      setValuesForUpdate: () => ({}),
      params: { id: params.id },
    });
    const queryClient = useQueryClient();

    const { mutate: generatePdf, isPending: isGeneratingPdf } = useMutation({
      mutationFn: () => api.mutate(generateNobrindeBudgetPdfDocument, { id: params.id }),
      onSuccess: (data: {
        generateNobrindeBudgetPdf: { success: boolean; error?: string; asset?: { id: string; source: string } };
      }) => {
        const result = data?.generateNobrindeBudgetPdf;
        if (result?.success) {
          const generatedAsset = result.asset;
          if (generatedAsset) {
            queryClient.setQueryData(['detail', pageId, params.id], (oldData: unknown) => {
              const old = oldData as { nobrindeBudget?: Record<string, unknown> } | undefined;
              if (!old?.nobrindeBudget) return oldData;
              return {
                ...old,
                nobrindeBudget: {
                  ...old.nobrindeBudget,
                  pdfAsset: generatedAsset,
                },
              };
            });
          }
          toast.success('PDF generated successfully');
          void queryClient.invalidateQueries({ queryKey: ['detail', pageId, params.id] });
        } else {
          toast.error(result?.error ?? 'Failed to generate PDF');
        }
      },
      onError: () => toast.error('Failed to generate PDF'),
    });

    if (!entity) {
      return null;
    }

    const budget = entity;
    const lines = budget.lines ?? [];
    const pdfAsset = budget.pdfAsset as { id: string; source: string } | null | undefined;
    const hasPdf = !!pdfAsset?.source;

    return (
      <Page pageId={pageId}>
        <PageTitle>
          <Trans>Nobrinde Budget</Trans>: #{budget.id_phc}
          {budget.data_documento ? ` – ${budget.data_documento}` : ''}
        </PageTitle>
        <PageActionBar>
          <PageActionBarRight>
            <NobrindeBudgetDetailSyncButton entityId={budget.id} />
            <Button variant="outline" onClick={() => generatePdf()} disabled={isGeneratingPdf}>
              <FileText className="mr-2 size-4" />
              {isGeneratingPdf ? 'Generating…' : 'Generate PDF'}
            </Button>
            {hasPdf && (
              <Button
                variant="outline"
                render={
                  <a
                    href={getAssetDownloadUrl(pdfAsset!.source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  />
                }
              >
                <FileDown className="mr-2 size-4" />
                <Trans>Download PDF</Trans>
              </Button>
            )}
          </PageActionBarRight>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="main" blockId="nobrinde-budget-header" title={<Trans>Budget</Trans>}>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">ID (PHC)</dt>
                <dd>{budget.id_phc}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Document date</dt>
                <dd>{budget.data_documento ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Company</dt>
                <dd>{budget.empresa ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">NIF</dt>
                <dd>{budget.nif ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Address</dt>
                <dd>{budget.morada ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Locality</dt>
                <dd>{budget.localidade ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Postal code</dt>
                <dd>{budget.c_postal ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Entity #</dt>
                <dd>{budget.nr_entidade ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Total (liquid)</dt>
                <dd>{budget.total_liq ?? '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Total</dt>
                <dd>{budget.total != null ? budget.total : '–'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">IVA</dt>
                <dd>{budget.iva != null ? budget.iva : '–'}</dd>
              </div>
            </dl>
          </PageBlock>
          <PageBlock column="main" blockId="nobrinde-budget-lines" title={<Trans>Lines</Trans>}>
            {lines.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                <Trans>No lines</Trans>
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Trans>Product</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Order</Trans>
                    </TableHead>
                    {/* <TableHead>
                      <Trans>Reference</Trans>
                    </TableHead> */}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {line.productVariant ? (
                          <div className="flex items-center gap-2">
                            <VendureImage asset={line.productVariant.featuredAsset} preset="tiny" />
                            <div className="min-w-0">
                              <DetailPageButton
                                // className="max-w-44 truncate overflow-hidden text-ellipsis"
                                href={`/product-variants/${line.productVariant.id}`}
                                label={
                                  line.productVariant.name ?? line.nome_produto ?? line.productVariant.sku
                                }
                                search={undefined}
                              />
                              <div className="text-xs text-muted-foreground">{line.productVariant.sku}</div>
                            </div>
                          </div>
                        ) : (
                          (line.nome_produto ?? '–')
                        )}
                      </TableCell>
                      <TableCell>{line.ordem ?? '–'}</TableCell>
                      {/* <TableCell>{line.referencia ?? line.referencia_externa ?? '–'}</TableCell> */}

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

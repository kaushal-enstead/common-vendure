import { DetailPageButton, ListPage, DashboardRouteDefinition } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { FileDown } from 'lucide-react';
import { nobrindeBudgetListDocument } from './nobrinde-budgets.graphql';

const pageId = 'nobrinde-budget-list';

function getAssetDownloadUrl(source: string): string {
  if (source.startsWith('http')) return source;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/assets/${source}`;
}

export const nobrindeBudgetsList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'nobrinde',
    id: 'nobrinde-budgets',
    url: '/nobrinde/budgets',
    title: 'Budgets',
  },
  path: '/nobrinde/budgets',
  loader: () => ({
    breadcrumb: 'Budgets',
  }),
  component: route => {
    return (
      <ListPage
        pageId={pageId}
        title={<Trans>Nobrinde Budgets</Trans>}
        listQuery={nobrindeBudgetListDocument}
        route={route}
        customizeColumns={{
          id_phc: {
            cell: ({ row }) => {
              const value = row.original.id_phc;
              const id = row.original.id;
              return <DetailPageButton id={id} label={String(value)} />;
            },
          },
          pdfAsset: {
            header: () => <Trans>PDF</Trans>,
            cell: ({ row }) => {
              const asset = row.original.pdfAsset;
              if (!asset?.source) return '–';
              return (
                <a
                  href={getAssetDownloadUrl(asset.source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <FileDown className="size-4" />
                  {/* <Trans>Download</Trans> */}
                </a>
              );
            },
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                empresa: { contains: searchTerm },
                ...(Number.isFinite(Number(searchTerm)) ? { id_phc: { eq: Number(searchTerm) } } : {}),
              }
            : {};
        }}
        defaultSort={[{ id: 'id_phc', desc: true }]}
        transformVariables={variables => {
          return {
            options: {
              ...variables.options,
              filterOperator: 'OR',
            },
          };
        }}
        defaultVisibility={{
          id: false,
          createdAt: false,
          updatedAt: false,
          pdfAsset: false,
        }}
      />
    );
  },
};

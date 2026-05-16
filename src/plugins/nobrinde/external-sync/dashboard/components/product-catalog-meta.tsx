import { api, Badge, cn, DetailPageButton } from '@vendure/dashboard';
import { useQuery } from '@tanstack/react-query';
import type { CellContext } from '@tanstack/react-table';

const GROUPED_PARENT_QUERY = `
  query GroupedParentProduct($childSku: String!) {
    groupedParentProduct(childSku: $childSku) {
      id
      name
    }
  }
`;

const TYPE_STYLES: Record<string, string> = {
  simple: 'border-sky-500/40 bg-sky-500/15 text-sky-100',
  variable: 'border-violet-500/40 bg-violet-500/15 text-violet-100',
  grouped: 'border-amber-500/40 bg-amber-500/15 text-amber-100',
  variation: 'border-slate-500/50 bg-slate-500/15 text-slate-100',
};

function labelForType(t: string | undefined): string {
  if (!t) return '—';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Shared badge for list + detail (external / ERP product type). */
export function ExternalProductTypeBadge({ type }: { type: string | null | undefined }) {
  const raw = type?.trim() || '';
  if (!raw) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const key = raw.toLowerCase();
  const cls = TYPE_STYLES[key] ?? 'border-border bg-muted/40 text-foreground';
  return (
    <Badge variant="secondary" className={cn('font-medium capitalize', cls)}>
      {labelForType(raw)}
    </Badge>
  );
}

/** Data table cell override for the Type column (`external_product_type`) on product list. */
export function ProductExternalTypeListCell(ctx: CellContext<any, unknown>) {
  const fromCell = ctx.cell.getValue() as string | undefined;
  const fromRow = (ctx.row.original as { customFields?: { external_product_type?: string } })?.customFields
    ?.external_product_type;
  return <ExternalProductTypeBadge type={fromCell ?? fromRow} />;
}

/** Sidebar: external product type. */
export function ProductDetailExternalTypeBlock({ context }: { context: { entity?: any } }) {
  const t = context.entity?.customFields?.external_product_type as string | undefined;
  return (
    <div className="flex flex-row items-center space-x-6">
      <div className="mb-2 text-base font-medium">Product type</div>
      <ExternalProductTypeBadge type={t} />
    </div>
  );
}

/** Sidebar: link to grouped parent when this product’s main SKU is a child of a grouped product. */
export function ProductDetailGroupedParentBlock({ context }: { context: { entity?: any } }) {
  const childSku = context.entity?.customFields?.main_sku as string | undefined;
  const isGroupedParent = context.entity?.customFields?.external_product_type === 'grouped';

  const { data, isLoading } = useQuery({
    queryKey: ['groupedParentProduct', childSku],
    queryFn: () =>
      api.query<{ groupedParentProduct: { id: string; name: string } | null }>(GROUPED_PARENT_QUERY, {
        childSku: childSku!,
      }),
    enabled: !!childSku && !isGroupedParent,
  });

  const parent = data?.groupedParentProduct;

  if (!childSku || isGroupedParent || isLoading || !parent?.id) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-2 text-sm font-medium text-muted-foreground">Parent product</div>
      <DetailPageButton
        id={parent.id}
        label={parent.name}
        className="h-auto w-full justify-between px-0 font-semibold"
      />
    </div>
  );
}

export function CollectionDetailExternalTypeBlock({ context }: { context: { entity?: any } }) {
  const parent = context.entity?.parent;
  return (
    <div className="">
      <div className="mb-4">Parent Collection</div>
      <DetailPageButton
        id={parent?.id}
        href={parent ? `/collections/${parent.id}` : undefined}
        label={parent?.name}
        className="h-auto w-full justify-between px-0 font-semibold"
      />
    </div>
  );
}

import {
  Button,
  Input,
  VendureImage,
  Table,
  ProductVariantSelector,
  SingleRelationInput,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ColumnDef,
  VisibilityState,
} from '@vendure/dashboard';
import { ResultOf } from 'gql.tada';
import { Trans, useLingui } from '@lingui/react/macro';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  couponCodeSelectorPromotionListDocument,
  budgetDetailDocument,
  budgetLineFragment,
} from '../budgets.graphql';
import { MoneyGrossNet } from './money-gross-net';
import { BudgetTableTotals } from './budget-table-totals';

type BudgetFragment = NonNullable<ResultOf<typeof budgetDetailDocument>['budget']>;
type BudgetLineFragment = ResultOf<typeof budgetLineFragment>;

export interface BudgetTableProps {
  budget: BudgetFragment;
  onAddItem: (variant: { productVariantId: string }) => void;
  onAdjustLine: (event: {
    budgetLineId: string;
    quantity: number;
    customFields: Record<string, any> | undefined;
  }) => void;
  onRemoveLine: (event: { lineId: string }) => void;
  //   onSetShippingMethod: (event: { shippingMethodId: string }) => void;
  onApplyCouponCode: (event: { couponCode: string }) => void;
  onRemoveCouponCode: (event: { couponCode: string }) => void;
  displayTotals?: boolean;
}

export function EditBudgetTable({
  budget,
  //   eligibleShippingMethods,
  onAddItem,
  onAdjustLine,
  onRemoveLine,
  //   onSetShippingMethod,
  onApplyCouponCode,
  onRemoveCouponCode,
  displayTotals = true,
}: Readonly<BudgetTableProps>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const { t } = useLingui();
  const currencyCode = budget.currencyCode;
  const columns: ColumnDef<BudgetLineFragment & { customFields?: Record<string, any> }>[] = useMemo(
    () => [
      {
        header: '',
        accessorKey: 'featuredAsset',
        cell: ({ row }) => {
          const asset = row.original.featuredAsset;
          const removing = row.original.quantity === 0;
          return <VendureImage className={removing ? 'opacity-50' : ''} asset={asset} preset="tiny" />;
        },
      },
      {
        header: t`Product`,
        accessorKey: 'productVariant.name',
        cell: ({ row }) => {
          const value = row.original.productVariant.name;
          const removing = row.original.quantity === 0;
          return <div className={removing ? 'text-muted-foreground' : ''}>{value}</div>;
        },
      },
      {
        header: t`SKU`,
        accessorKey: 'productVariant.sku',
      },
      {
        header: t`Unit price`,
        accessorKey: 'unitPriceWithTax',
        cell: ({ row }) => {
          const value = row.original.unitPriceWithTax;
          const netValue = row.original.unitPrice;
          return <MoneyGrossNet priceWithTax={value} price={netValue} currencyCode={currencyCode} />;
        },
      },
      {
        header: t`Quantity`,
        accessorKey: 'quantity',
        cell: ({ row }) => {
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                value={row.original.quantity}
                min={0}
                onChange={e => {
                  const value = Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                  onAdjustLine({
                    budgetLineId: row.original.id,
                    quantity: value,
                    customFields: row.original.customFields,
                  });
                }}
              />
              <Button
                variant="outline"
                type="button"
                size="icon"
                disabled={row.original.quantity === 0}
                onClick={() => onRemoveLine({ lineId: row.original.id })}
              >
                <Trash2 />
              </Button>
            </div>
          );
        },
      },
      {
        header: t`Total`,
        accessorKey: 'linePriceWithTax',
        cell: ({ row }) => {
          const value = row.original.linePriceWithTax;
          const netValue = row.original.linePrice;
          return <MoneyGrossNet priceWithTax={value} price={netValue} currencyCode={currencyCode} />;
        },
      },
    ],
    [],
  );

  const data = budget.lines;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    rowCount: data.length,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <div className="">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length
              ? table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            <TableRow>
              <TableCell colSpan={columns.length} className="h-12">
                <div className="my-4 flex justify-center">
                  <div className="max-w-lg">
                    <ProductVariantSelector onProductVariantSelect={onAddItem} />
                  </div>
                </div>
              </TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell colSpan={columns.length} className="h-12">
                <ShippingMethodSelector
                  eligibleShippingMethods={eligibleShippingMethods}
                  selectedShippingMethodId={order.shippingLines?.[0]?.shippingMethod?.id}
                  currencyCode={currencyCode}
                  onSelect={shippingMethodId => onSetShippingMethod({ shippingMethodId })}
                />
              </TableCell>
            </TableRow> */}
            <TableRow>
              <TableCell colSpan={columns.length} className="h-12">
                <div className="flex gap-4">
                  {budget.couponCodes?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {budget.couponCodes.map(code => (
                        <div
                          key={code}
                          className="flex items-center gap-2 px-3 py-1 text-sm border rounded-md"
                        >
                          <span>{code}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onRemoveCouponCode({ couponCode: code })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <SingleRelationInput
                    config={{
                      listQuery: couponCodeSelectorPromotionListDocument as never,
                      idKey: 'couponCode',
                      labelKey: 'couponCode',
                      placeholder: 'Search coupon codes...',
                      label: item => `${item.couponCode} (${(item as any).name})`,
                    }}
                    name="couponCode"
                    onBlur={() => {}}
                    ref={() => {}}
                    value={''}
                    selectorLabel={<Trans>Add coupon code</Trans>}
                    onChange={code => onApplyCouponCode({ couponCode: code })}
                  />
                </div>
              </TableCell>
            </TableRow>
            {displayTotals && <BudgetTableTotals budget={budget} columnCount={columns.length} />}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

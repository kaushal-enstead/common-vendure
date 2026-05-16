import {
  Button,
  Input,
  VendureImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DetailPageButton,
  api,
  StockLevelLabel,
  Badge,
  ColumnDef,
  VisibilityState,
  keepPreviousData,
  useMutation,
  useQuery,
  toast,
} from '@vendure/dashboard';

import { ResultOf } from 'gql.tada';
import { Trans, useLingui } from '@lingui/react/macro';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  createKitVariantDocument,
  deleteKitVariantDocument,
  kitDetailDocument,
  kitVariantListDocument,
  updateKitVariantDocument,
} from '../kits.graphql';
import { MoneyGrossNet } from './money-gross-net';
import { ProductVariantSelector } from './product-variant-selector';

type KitFragment = NonNullable<ResultOf<typeof kitDetailDocument>['kit']>;
type KitVariantFragment = ResultOf<typeof kitVariantListDocument>['kitVariants']['items'][0];

export interface KitVariantTableProps {
  kitId: string;
  // onApplyCouponCode: (event: { couponCode: string }) => void;
  // onRemoveCouponCode: (event: { couponCode: string }) => void;
  displayTotals?: boolean;
}

export function EditKitVariantTable({
  kitId,
  // onApplyCouponCode,
  // onRemoveCouponCode,
  displayTotals = true,
}: Readonly<KitVariantTableProps>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const { t } = useLingui();

  const {
    data: variantData,
    isFetching,
    refetch: refreshEntity,
  } = useQuery({
    queryFn: () => {
      return api.query(kitVariantListDocument, { kitId: kitId });
    },
    queryKey: ['kit-variants', kitId],
    placeholderData: keepPreviousData,
  });

  const { mutate: createKitVariant } = useMutation({
    mutationFn: api.mutate(createKitVariantDocument),
    onSuccess: (result: ResultOf<typeof createKitVariantDocument>) => {
      const kitVariant = result.createKitVariant;
      if (kitVariant.id) {
        toast.success(t`Kit variant added`);
        refreshEntity();
      } else {
        toast.error(t`Failed to add kit variant`);
      }
    },
    onError: error => {
      if ((error as any).extensions?.code === 'ENTITY_NOT_FOUND') {
        toast.error(t`The variant could not be added. Ensure the parent product is enabled.`);
      }
    },
  });

  const { mutate: updateKitVariant } = useMutation({
    mutationFn: api.mutate(updateKitVariantDocument),
    onSuccess: (result: ResultOf<typeof updateKitVariantDocument>) => {
      const kitVariant = result.updateKitVariant;
      if (kitVariant.id) {
        toast.success(t`Kit variant updated`);
        refreshEntity();
      } else {
        toast.error(t`Failed to update kit variant`);
      }
    },
  });

  const { mutate: deleteKitVariant } = useMutation({
    mutationFn: api.mutate(deleteKitVariantDocument),
    onSuccess: (result: ResultOf<typeof deleteKitVariantDocument>) => {
      const kitVariant = result.deleteKitVariant;
      if (kitVariant.result === 'DELETED') {
        toast.success(t`Kit variant removed`);
        refreshEntity();
      } else {
        toast.error(t`Failed to delete kit variant`);
      }
    },
  });

  // const currencyCode = kit.variant.currencyCode;
  const columns: ColumnDef<KitVariantFragment>[] = useMemo(
    () => [
      {
        header: t`Featured Asset`,
        accessorKey: 'productVariant.featuredAsset',
        cell: ({ row }) => {
          const asset = row.original.productVariant.featuredAsset;
          const removing = row.original.quantity === 0;
          return <VendureImage className={removing ? 'opacity-50' : ''} asset={asset} preset="tiny" />;
        },
      },
      {
        header: t`Variant Name`,
        accessorKey: 'productVariant.name',
        cell: ({ row: { original } }) => (
          <DetailPageButton
            href={`/dashboard/product-variants/${original.productVariantId}`}
            label={original.productVariant.name}
            search={undefined}
          />
        ),
      },
      {
        header: t`Enabled`,
        accessorKey: 'productVariant.enabled',
        cell: ({ row }) => {
          return (
            <Badge variant={row.original.productVariant.enabled ? 'success' : 'destructive'}>
              {row.original.productVariant.enabled ? t`Enabled` : t`Disabled`}
            </Badge>
          );
        },
      },
      // {
      //   header: t`Unit price`,
      //   accessorKey: 'variant.priceWithTax',
      //   cell: ({ row }) => {
      //     const value = row.original.variant.priceWithTax;
      //     const netValue = row.original.variant.price;
      //     return (
      //       <MoneyGrossNet
      //         priceWithTax={value as number}
      //         price={netValue as number}
      //         currencyCode={row.original.variant.currencyCode as string}
      //       />
      //     );
      //   },
      // },
      {
        header: t`Quantity`,
        accessorKey: 'quantity',
        cell: ({ row }) => {
          return (
            <Input
              type="number"
              value={row.original.quantity}
              min={0}
              className="w-20"
              onChange={e => {
                const value = Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                updateKitVariant({
                  input: { id: row.original.id, quantity: value },
                });
              }}
            />
          );
        },
      },
      {
        header: t`Discount`,
        accessorKey: 'discount',
        cell: ({ row }) => {
          return (
            <Input
              type="number"
              value={row.original.discount ?? 0}
              min={0}
              className="w-20"
              onChange={e => {
                const value = Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                updateKitVariant({
                  input: { id: row.original.id, discount: value },
                });
              }}
            />
          );
        },
      },
      {
        header: t`Stock Levels`,
        accessorKey: 'productVariant.stockLevels',
        cell: ({ row: { original } }) => (
          <StockLevelLabel stockLevels={original.productVariant.stockLevels} />
        ),
      },
      {
        header: t`Price`,
        accessorKey: 'productVariant.priceWithTax',
        cell: ({ row }) => {
          const value = row.original.productVariant.priceWithTax;
          const netValue = row.original.productVariant.price;
          return (
            <MoneyGrossNet
              priceWithTax={value}
              price={netValue}
              currencyCode={row.original.productVariant.currencyCode}
            />
          );
        },
      },
      {
        header: '',
        accessorKey: 'actions',
        cell: ({ row }) => {
          return (
            <Button variant="outline" size="icon" onClick={() => deleteKitVariant({ id: row.original.id })}>
              <Trash2 />
            </Button>
          );
        },
      },
    ],
    [],
  );

  const data = variantData?.kitVariants.items ?? [];

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
                    <ProductVariantSelector
                      onProductVariantSelect={({ productVariantId }) =>
                        createKitVariant({
                          input: {
                            productVariantId: productVariantId,
                            kitId: kitId,
                            quantity: 1,
                            discount: 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

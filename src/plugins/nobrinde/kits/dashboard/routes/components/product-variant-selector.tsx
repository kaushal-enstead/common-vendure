import {
  assetFragment,
  AssetFragment,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useQuery,
} from '@vendure/dashboard';
import { Popover, PopoverContent, PopoverTrigger } from '@vendure/dashboard';
import { api } from '@vendure/dashboard';
import { graphql } from '@/gql';
import { useDebounce } from '@uidotdev/usehooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@vendure/dashboard';
import { VendureImage } from '@vendure/dashboard';

const productVariantListDocument = graphql(
  `
    query ProductVariantList($options: ProductVariantListOptions) {
      productVariants(options: $options) {
        items {
          id
          name
          sku
          featuredAsset {
            ...Asset
          }
          price
          priceWithTax
          product {
            featuredAsset {
              ...Asset
            }
          }
        }
        totalItems
      }
    }
  `,
  [assetFragment],
);

export interface ProductVariantSelectorProps {
  onProductVariantSelect: (variant: {
    productVariantId: string;
    productVariantName: string;
    sku: string;
    productAsset: AssetFragment | null;
    price?: number;
    priceWithTax?: number;
  }) => void;
}

export function ProductVariantSelector({ onProductVariantSelect }: Readonly<ProductVariantSelectorProps>) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  const { data } = useQuery({
    queryKey: ['productVariants', debouncedSearch],
    staleTime: 1000 * 60 * 5,
    enabled: debouncedSearch.length > 0,
    queryFn: () =>
      api.query(productVariantListDocument, {
        options: {
          take: 10,
          filter: {
            name: { contains: debouncedSearch },
            sku: { contains: debouncedSearch },
          },
          filterOperator: 'OR',
        },
      }),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" role="combobox" className="w-full" />}>
        Add item to kit
        <Plus className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Add item to kit..."
            className="h-9"
            onValueChange={value => setSearch(value)}
          />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {data?.productVariants.items.map(variant => (
                <CommandItem
                  key={variant.id}
                  value={variant.id}
                  onSelect={() => {
                    onProductVariantSelect({
                      productVariantId: variant.id,
                      productVariantName: variant.name,
                      sku: variant.sku,
                      productAsset: variant.featuredAsset ?? variant.product.featuredAsset ?? null,
                      price: variant.price,
                      priceWithTax: variant.priceWithTax,
                    });
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 p-2"
                >
                  {variant.featuredAsset && (
                    <VendureImage
                      asset={variant.featuredAsset}
                      preset="tiny"
                      className="size-8 rounded-md object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{variant.name}</span>
                    <span className="text-xs text-muted-foreground">{variant.sku}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

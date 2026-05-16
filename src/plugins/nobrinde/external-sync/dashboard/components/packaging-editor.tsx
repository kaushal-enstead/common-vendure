import { Badge, Button, DashboardFormComponent, Input, NumberInput, Switch } from '@vendure/dashboard';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

type PackagingDimensions = {
  diameter: number | null;
  diameter_unit: string | null;
  height: number | null;
  height_unit: string | null;
  length: number | null;
  length_unit: string | null;
  size_combined: string | null;
  width: number | null;
  width_unit: string | null;
};

type PackagingItem = {
  blank_product_individual_packing: boolean | null;
  description: string | null;
  dimensions: PackagingDimensions | null;
  gross_weight: number | null;
  has_individual_packaging: boolean | null;
  name: string | null;
  net_weight: number | null;
  package_level: number;
  package_level_name: string;
  package_type: {
    en: string;
    es: string;
    fr: string;
    pt: string;
  };
  packaging_after_printing: string | null;
  quantity: number;
  volume: number | null;
  volume_unit: string | null;
  weight_unit: string;
};

const defaultDimensions: PackagingDimensions = {
  diameter: null,
  diameter_unit: 'cm',
  height: null,
  height_unit: 'cm',
  length: null,
  length_unit: 'cm',
  size_combined: null,
  width: null,
  width_unit: 'cm',
};

const defaultPackagingItem: PackagingItem = {
  blank_product_individual_packing: null,
  description: null,
  dimensions: null,
  gross_weight: null,
  has_individual_packaging: null,
  name: null,
  net_weight: null,
  package_level: 1,
  package_level_name: '',
  package_type: {
    en: '',
    es: '',
    fr: '',
    pt: '',
  },
  packaging_after_printing: null,
  quantity: 0,
  volume: null,
  volume_unit: null,
  weight_unit: 'kg',
};

type FormValue = PackagingItem[];

function parsePackagingInput(value: unknown): FormValue {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  if (typeof value !== 'string') {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const PackagingEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const items: FormValue = parsePackagingInput(value);

  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const toggleCollapsed = (index: number) => {
    setCollapsed(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const updateItem = (index: number, patch: Partial<PackagingItem>) => {
    const next = [...items];
    next[index] = { ...(next[index] ?? defaultPackagingItem), ...patch };
    onChange(next);
  };

  const updateDimensions = (index: number, patch: Partial<PackagingDimensions>) => {
    const item = items[index] ?? defaultPackagingItem;
    const dims: PackagingDimensions = { ...(item.dimensions ?? defaultDimensions), ...patch };
    updateItem(index, { dimensions: dims });
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        ...defaultPackagingItem,
        package_level: (items[items.length - 1]?.package_level ?? 0) + 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div
      className="space-y-6"
      style={{
        width: '200%',
        maxWidth: 'none',
        // marginLeft: '-50%',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold"></h3>
        <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add packaging
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No packaging configurations. Click &quot;Add packaging&quot; to define packaging levels such as
          inner and outer cartons.
        </p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm"
                onClick={() => toggleCollapsed(index)}
              >
                {collapsed[index] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
                <Badge variant="outline">Level {item.package_level ?? index + 1}</Badge>
                <span className="font-medium">{item.package_level_name || 'Untitled packaging'}</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!collapsed[index] && (
              <>
                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Package level</label>
                    <NumberInput
                      name="package_level"
                      value={item.package_level ?? 0}
                      onChange={val => updateItem(index, { package_level: val ?? 0 })}
                      disabled={disabled}
                      onBlur={() => {}}
                      ref={() => {}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Level name</label>
                    <Input
                      value={item.package_level_name ?? ''}
                      onChange={e => updateItem(index, { package_level_name: e.target.value })}
                      disabled={disabled}
                      placeholder="e.g. inner_carton, outer_carton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <NumberInput
                      name="quantity"
                      value={item.quantity ?? 0}
                      onChange={val => updateItem(index, { quantity: val ?? 0 })}
                      disabled={disabled}
                      onBlur={() => {}}
                      ref={() => {}}
                    />
                  </div>
                </div>

                {/* Package type (localized) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Package type (EN)</label>
                    <Input
                      value={item.package_type?.en ?? ''}
                      onChange={e =>
                        updateItem(index, {
                          package_type: {
                            ...(item.package_type ?? defaultPackagingItem.package_type),
                            en: e.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Package type (PT)</label>
                    <Input
                      value={item.package_type?.pt ?? ''}
                      onChange={e =>
                        updateItem(index, {
                          package_type: {
                            ...(item.package_type ?? defaultPackagingItem.package_type),
                            pt: e.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Package type (ES)</label>
                    <Input
                      value={item.package_type?.es ?? ''}
                      onChange={e =>
                        updateItem(index, {
                          package_type: {
                            ...(item.package_type ?? defaultPackagingItem.package_type),
                            es: e.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Package type (FR)</label>
                    <Input
                      value={item.package_type?.fr ?? ''}
                      onChange={e =>
                        updateItem(index, {
                          package_type: {
                            ...(item.package_type ?? defaultPackagingItem.package_type),
                            fr: e.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground">Dimensions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Length</label>
                      <NumberInput
                        name="length"
                        value={item.dimensions?.length ?? 0}
                        onChange={val => updateDimensions(index, { length: val ?? null })}
                        disabled={disabled}
                        onBlur={() => {}}
                        ref={() => {}}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Length unit</label>
                      <Input
                        value={item.dimensions?.length_unit ?? 'cm'}
                        onChange={e => updateDimensions(index, { length_unit: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Width</label>
                      <NumberInput
                        name="width"
                        value={item.dimensions?.width ?? 0}
                        onChange={val => updateDimensions(index, { width: val ?? null })}
                        disabled={disabled}
                        onBlur={() => {}}
                        ref={() => {}}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Width unit</label>
                      <Input
                        value={item.dimensions?.width_unit ?? 'cm'}
                        onChange={e => updateDimensions(index, { width_unit: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Height</label>
                      <NumberInput
                        name="height"
                        value={item.dimensions?.height ?? 0}
                        onChange={val => updateDimensions(index, { height: val ?? null })}
                        disabled={disabled}
                        onBlur={() => {}}
                        ref={() => {}}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Height unit</label>
                      <Input
                        value={item.dimensions?.height_unit ?? 'cm'}
                        onChange={e => updateDimensions(index, { height_unit: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Diameter</label>
                      <NumberInput
                        name="diameter"
                        value={item.dimensions?.diameter ?? 0}
                        onChange={val => updateDimensions(index, { diameter: val ?? null })}
                        disabled={disabled}
                        onBlur={() => {}}
                        ref={() => {}}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Diameter unit</label>
                      <Input
                        value={item.dimensions?.diameter_unit ?? 'cm'}
                        onChange={e => updateDimensions(index, { diameter_unit: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Combined size</label>
                    <Input
                      value={item.dimensions?.size_combined ?? ''}
                      onChange={e => updateDimensions(index, { size_combined: e.target.value })}
                      disabled={disabled}
                      placeholder="e.g. 45.00x31.00x19.00x1.00"
                    />
                  </div>
                </div>

                {/* Weights & volume */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gross weight</label>
                    <NumberInput
                      name="gross_weight"
                      value={item.gross_weight ?? 0}
                      onChange={val => updateItem(index, { gross_weight: val ?? null })}
                      disabled={disabled}
                      onBlur={() => {}}
                      ref={() => {}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Net weight</label>
                    <NumberInput
                      name="net_weight"
                      value={item.net_weight ?? 0}
                      onChange={val => updateItem(index, { net_weight: val ?? null })}
                      disabled={disabled}
                      onBlur={() => {}}
                      ref={() => {}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight unit</label>
                    <Input
                      value={item.weight_unit ?? 'kg'}
                      onChange={e => updateItem(index, { weight_unit: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Has individual packaging</label>
                    <Switch
                      checked={!!item.has_individual_packaging}
                      onCheckedChange={val => updateItem(index, { has_individual_packaging: val as boolean })}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Volume</label>
                    <NumberInput
                      name="volume"
                      value={item.volume ?? 0}
                      onChange={val => updateItem(index, { volume: val ?? null })}
                      disabled={disabled}
                      onBlur={() => {}}
                      ref={() => {}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Volume unit</label>
                    <Input
                      value={item.volume_unit ?? ''}
                      onChange={e => updateItem(index, { volume_unit: e.target.value })}
                      disabled={disabled}
                      placeholder="e.g. dm3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Packaging after printing</label>
                    <Input
                      value={item.packaging_after_printing ?? ''}
                      onChange={e => updateItem(index, { packaging_after_printing: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* Description & name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Internal name</label>
                    <Input
                      value={item.name ?? ''}
                      onChange={e => updateItem(index, { name: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (EN)</label>
                    <Input
                      value={item.description ?? ''}
                      onChange={e => updateItem(index, { description: e.target.value })}
                      disabled={disabled}
                      placeholder="Optional description for this packaging level"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

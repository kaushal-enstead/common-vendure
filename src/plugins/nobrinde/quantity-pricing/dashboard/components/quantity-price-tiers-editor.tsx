import { Button, DashboardFormComponent, MoneyInput, NumberInput } from '@vendure/dashboard';
import { Plus, Trash2 } from 'lucide-react';

interface QuantityPriceTier {
  price: number;
  quantityStart: number;
  quantityEnd: number;
}

const defaultTier: QuantityPriceTier = {
  price: 0,
  quantityStart: 1,
  quantityEnd: 1,
};

export const QuantityPriceTiersEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const tiers: QuantityPriceTier[] = Array.isArray(value) ? value : [];

  const updateTier = (index: number, field: keyof QuantityPriceTier, val: number) => {
    const next = [...tiers];
    next[index] = { ...(next[index] ?? defaultTier), [field]: val };
    onChange(next);
  };

  const addTier = () => {
    onChange([...tiers, { ...defaultTier, quantityStart: 1, quantityEnd: 1 }]);
  };

  const removeTier = (index: number) => {
    const next = tiers.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div
      className="space-y-4"
      style={{
        // Span full width when form uses 2-column grid (break out of 50% column)
        width: '200%',
        maxWidth: 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium"></span>
        <Button type="button" variant="outline" size="sm" onClick={addTier} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add price
        </Button>
      </div>

      {tiers.length > 0 && (
        <div className="w-full overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="w-16 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Price (per unit)</th>
                <th className="px-4 py-3 font-medium">Quantity start</th>
                <th className="px-4 py-3 font-medium">Quantity end</th>
                <th className="w-14 px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, index) => (
                <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 align-middle text-muted-foreground tabular-nums">{index + 1}</td>
                  <td className="px-4 py-2 align-middle">
                    <div className="]">
                      <MoneyInput
                        name={`quantityPriceTiers.${index}.price`}
                        value={tier.price ?? 0}
                        onChange={val => updateTier(index, 'price', val)}
                        onBlur={() => {}}
                        ref={() => {}}
                        disabled={disabled}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <NumberInput
                      name={`quantityPriceTiers.${index}.quantityStart`}
                      min={0}
                      step={1}
                      value={tier.quantityStart ?? 0}
                      onChange={val => updateTier(index, 'quantityStart', val)}
                      onBlur={() => {}}
                      ref={() => {}}
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <NumberInput
                      name={`quantityPriceTiers.${index}.quantityEnd`}
                      value={tier.quantityEnd ?? 0}
                      onChange={val => updateTier(index, 'quantityEnd', val)}
                      onBlur={() => {}}
                      ref={() => {}}
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      color="danger"
                      onClick={() => removeTier(index)}
                      disabled={disabled}
                      title="Delete tier"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* {tiers.length === 0 && (
        <p className="text-sm text-muted-foreground py-3">
          No tiers. Click &quot;Add price&quot; to add a tier. When order quantity falls within a
          range, that price is applied per unit.
        </p>
      )} */}
    </div>
  );
};

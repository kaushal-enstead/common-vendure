import {
  api,
  Button,
  DashboardFormComponent,
  MoneyInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  cn,
  useQuery,
} from '@vendure/dashboard';
import { graphql } from '@/gql';
import { Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ZoneRateRow = {
  zoneName: string;
  pricePerKgEUR: number;
  freeShipping: boolean;
  minAmountEUR: number;
  quoteEnabled: boolean;
};

const defaultRow: ZoneRateRow = {
  zoneName: '',
  pricePerKgEUR: 0,
  freeShipping: false,
  minAmountEUR: 0,
  quoteEnabled: false,
};

const toFiniteNumber = (value: unknown): number => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const normalizeRow = (value: unknown): ZoneRateRow => {
  if (value == null || typeof value !== 'object') {
    return { ...defaultRow };
  }
  const row = value as Record<string, unknown>;
  const legacyThreshold = toFiniteNumber(row.freeShippingThresholdEUR);
  const freeShipping =
    row.freeShipping === true || (row.freeShipping === undefined && legacyThreshold > 0);
  const minAmountEUR =
    row.minAmountEUR === undefined ? legacyThreshold : toFiniteNumber(row.minAmountEUR);
  return {
    zoneName: String(row.zoneName ?? '').trim(),
    pricePerKgEUR: toFiniteNumber(row.pricePerKgEUR),
    freeShipping,
    minAmountEUR,
    quoteEnabled: row.quoteEnabled === true || row.requiresManualQuote === true,
  };
};

const parseRows = (value: unknown): { rows: ZoneRateRow[]; error: string | null } => {
  if (Array.isArray(value)) {
    return { rows: value.map(normalizeRow), error: null };
  }
  if (value == null || value === '') {
    return { rows: [], error: null };
  }
  if (typeof value !== 'string') {
    return { rows: [], error: 'Zone rates value is not valid JSON text.' };
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return { rows: [], error: 'Zone rates JSON must be an array.' };
    }
    return { rows: parsed.map(normalizeRow), error: null };
  } catch {
    return { rows: [], error: 'Zone rates JSON is invalid. Editing below will replace it.' };
  }
};

const serializeRows = (rows: ZoneRateRow[]): string => JSON.stringify(rows, null, 2);

const zoneNamesDocument = graphql(`
  query ZoneNamesForCustomShipping($options: ZoneListOptions) {
    zones(options: $options) {
      items {
        id
        name
      }
      totalItems
    }
  }
`);

export const ZoneRatesEditor: DashboardFormComponent = ({ value, onChange, disabled, fieldDef }) => {
  const initial = useMemo(() => {
    const parsedValue = parseRows(value);
    if (parsedValue.rows.length > 0 || parsedValue.error) {
      return parsedValue;
    }
    return parseRows(fieldDef?.defaultValue);
  }, [value, fieldDef?.defaultValue]);

  const [rows, setRows] = useState<ZoneRateRow[]>(initial.rows);
  const [parseError, setParseError] = useState<string | null>(initial.error);
  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ['custom-shipping-zone-names'],
    queryFn: () =>
      api.query(zoneNamesDocument, {
        options: { take: 250, skip: 0 },
      }),
  });

  const zoneOptions = useMemo(
    () =>
      [...(zonesData?.zones?.items ?? [])]
        .filter(zone => Boolean(zone?.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [zonesData?.zones?.items],
  );
  const zoneNameSet = useMemo(() => new Set(zoneOptions.map(zone => zone.name)), [zoneOptions]);
  const checkerFullWidth = fieldDef?.ui?.fullWidth === true;

  useEffect(() => {
    const parsed = parseRows(value);
    if (!parsed.error) {
      setRows(parsed.rows);
    }
    setParseError(parsed.error);
  }, [value]);

  const commit = (nextRows: ZoneRateRow[]) => {
    setRows(nextRows);
    setParseError(null);
    onChange(serializeRows(nextRows));
  };

  const updateRow = (index: number, patch: Partial<ZoneRateRow>) => {
    const next = [...rows];
    next[index] = { ...(next[index] ?? defaultRow), ...patch };
    commit(next);
  };

  const addRow = () => {
    commit([...rows, { ...defaultRow }]);
  };

  const removeRow = (index: number) => {
    commit(rows.filter((_, i) => i !== index));
  };

  return (
    <div
      className="space-y-4"
      style={
        checkerFullWidth
          ? {
              width: '200%',
              maxWidth: 'none',
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Configure one row per Vendure zone. Zone name options are loaded from Vendure zones.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add zone
        </Button>
      </div>

      {parseError && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900',
          )}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs">{parseError}</p>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No zones configured yet. Click <strong>Add zone</strong>.
        </p>
      ) : (
        <div className="w-full overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="w-12 px-3 py-2 font-medium">#</th>
                <th className="min-w-[240px] px-3 py-2 font-medium">Zone name</th>
                <th className="min-w-[180px] px-3 py-2 font-medium">Price per kg (EUR)</th>
                <th className="min-w-[170px] px-3 py-2 font-medium">Free shipping</th>
                <th className="min-w-[220px] px-3 py-2 font-medium">Min amount (EUR)</th>
                <th className="min-w-[180px] px-3 py-2 font-medium">Quote required</th>
                <th className="w-14 px-3 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b align-top last:border-b-0">
                  <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={row.zoneName || undefined}
                      onValueChange={nextZoneName => updateRow(index, { zoneName: nextZoneName || '' })}
                      disabled={disabled || zonesLoading || zoneOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            zonesLoading
                              ? 'Loading zones...'
                              : zoneOptions.length === 0
                                ? 'No zones found'
                                : 'Select zone'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneOptions.map(zone => (
                          <SelectItem key={zone.id} value={zone.name}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {row.zoneName && !zoneNameSet.has(row.zoneName) && (
                      <p className="mt-1 text-xs text-amber-700">
                        Existing value "{row.zoneName}" is not in current zones. Please re-select.
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <MoneyInput
                      name={`zoneRates.${index}.pricePerKgEUR`}
                      // min={0}
                      // step={0.01}
                      value={row.pricePerKgEUR}
                      onChange={val => updateRow(index, { pricePerKgEUR: toFiniteNumber(val) })}
                      onBlur={() => {}}
                      ref={() => {}}
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex h-9 items-center gap-2">
                      <Switch
                        checked={row.freeShipping}
                        onCheckedChange={checked =>
                          updateRow(index, {
                            freeShipping: checked === true,
                            minAmountEUR: checked === true ? row.minAmountEUR : 0,
                          })
                        }
                        disabled={disabled}
                      />
                      <span className="text-xs text-muted-foreground">
                        {row.freeShipping ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {row.freeShipping ? (
                      <MoneyInput
                        name={`zoneRates.${index}.minAmountEUR`}
                        value={row.minAmountEUR}
                        onChange={val => updateRow(index, { minAmountEUR: toFiniteNumber(val) })}
                        onBlur={() => {}}
                        ref={() => {}}
                        disabled={disabled}
                      />
                    ) : (
                      <div className="flex h-9 items-center text-xs text-muted-foreground">
                        Not required
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex h-9 items-center gap-2">
                      <Switch
                        checked={row.quoteEnabled}
                        onCheckedChange={checked =>
                          updateRow(index, { quoteEnabled: checked === true })
                        }
                        disabled={disabled}
                      />
                      <span className="text-xs text-muted-foreground">
                        {row.quoteEnabled ? 'Required' : 'Not required'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      disabled={disabled}
                      title="Remove zone rate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

ZoneRatesEditor.metadata = {
  isFullWidth: true,
};

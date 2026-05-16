import { Button, DashboardFormComponent } from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

function buildTimeOptions(): { value: string; label: string }[] {
    return Array.from({ length: 48 }, (_, i) => {
        const hour = String(Math.floor(i / 2)).padStart(2, '0');
        const minute = i % 2 === 0 ? '00' : '30';
        const time = `${hour}:${minute}`;
        return { value: time, label: time };
    });
}

const DAYS: { value: string; label: string }[] = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

interface HourEntry {
    day: string | null;
    openingHour: string | null;
    closingHour: string | null;
}

export const SellerStructDaysInput: DashboardFormComponent = ({ value, onChange, disabled, onBlur, name, ref }) => {
    const { t } = useLingui();
    const timeOptions = useMemo(buildTimeOptions, []);
    const entries: HourEntry[] = Array.isArray(value)
        ? value.map((item: any) => ({
              day: item?.day ?? null,
              openingHour: item?.openingHour ?? null,
              closingHour: item?.closingHour ?? null,
          }))
        : [];

    const setEntries = (nextEntries: HourEntry[]) => {
        onChange(nextEntries);
    };

    const updateEntry = (index: number, patch: Partial<HourEntry>) => {
        const next = entries.map((row, i) => (i === index ? { ...row, ...patch } : row));
        setEntries(next);
    };

    const addEntry = () => {
        setEntries([...entries, { day: null, openingHour: null, closingHour: null }]);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                {entries.map((entry, i) => (
                    <div
                        key={i}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2"
                    >
                        <select
                            ref={i === 0 ? ref : undefined}
                            name={i === 0 ? name : undefined}
                            className="h-9 min-w-[120px] flex-1 rounded-md border border-input bg-background px-2 text-sm"
                            disabled={disabled}
                            value={entry.day ?? ''}
                            onBlur={i === 0 ? onBlur : undefined}
                            onChange={e => updateEntry(i, { day: e.target.value || null })}
                        >
                            <option value="">{t`Select day`}</option>
                            {DAYS.map(d => (
                                <option key={d.value} value={d.value}>
                                    {d.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="h-9 min-w-[100px] flex-1 rounded-md border border-input bg-background px-2 text-sm"
                            disabled={disabled}
                            value={entry.openingHour ?? ''}
                            onChange={e => updateEntry(i, { openingHour: e.target.value || null })}
                        >
                            <option value="">{t`Opening hour`}</option>
                            {timeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.value}
                                </option>
                            ))}
                        </select>
                        <select
                            className="h-9 min-w-[100px] flex-1 rounded-md border border-input bg-background px-2 text-sm"
                            disabled={disabled}
                            value={entry.closingHour ?? ''}
                            onChange={e => updateEntry(i, { closingHour: e.target.value || null })}
                        >
                            <option value="">{t`Closing hour`}</option>
                            {timeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.value}
                                </option>
                            ))}
                        </select>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className="shrink-0"
                            onClick={() => removeEntry(i)}
                            aria-label="Remove row"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button type="button" variant="secondary" size="sm" className="w-fit" disabled={disabled} onClick={addEntry}>
                <Plus className="mr-1 h-4 w-4" />
                <Trans>Add item to list</Trans>
            </Button>
        </div>
    );
};

SellerStructDaysInput.metadata = { isListInput: true };

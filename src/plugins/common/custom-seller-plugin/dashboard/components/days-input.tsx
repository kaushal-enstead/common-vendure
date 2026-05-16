import { Button, DashboardFormComponent } from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HourEntry {
    day: string | null;
    openingHour: string | null;
    closingHour: string | null;
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

function buildTimeOptions(): { value: string; label: string }[] {
    return Array.from({ length: 48 }, (_, i) => {
        const hour = String(Math.floor(i / 2)).padStart(2, '0');
        const minute = i % 2 === 0 ? '00' : '30';
        const time = `${hour}:${minute}`;
        return { value: time, label: time };
    });
}

function parseHours(value: unknown): HourEntry[] {
    if (value == null) {
        return [];
    }
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => ({
                    day: item?.day ?? null,
                    openingHour: item?.openingHour ?? null,
                    closingHour: item?.closingHour ?? null,
                }));
            }
        } catch {
            return [];
        }
    }
    if (Array.isArray(value)) {
        return value.map((item: any) => ({
            day: item?.day ?? null,
            openingHour: item?.openingHour ?? null,
            closingHour: item?.closingHour ?? null,
        }));
    }
    return [];
}

export const SellerDaysInput: DashboardFormComponent = ({ value, onChange, disabled }) => {
    const { t } = useLingui();
    const timeOptions = useMemo(buildTimeOptions, []);
    const [hoursArray, setHoursArray] = useState<HourEntry[]>(() => parseHours(value));

    useEffect(() => {
        setHoursArray(parseHours(value));
    }, [value]);

    const pushToForm = (entries: HourEntry[]) => {
        const filtered = entries.filter(e => e.day || e.openingHour || e.closingHour);
        const jsonString = JSON.stringify(filtered);
        if (jsonString !== value) {
            onChange(jsonString);
        }
    };

    const updateEntry = (index: number, patch: Partial<HourEntry>) => {
        const next = hoursArray.map((row, i) => (i === index ? { ...row, ...patch } : row));
        setHoursArray(next);
        pushToForm(next);
    };

    const addEntry = () => {
        const next = [...hoursArray, { day: null, openingHour: null, closingHour: null }];
        setHoursArray(next);
        pushToForm(next);
    };

    const removeEntry = (index: number) => {
        const next = hoursArray.filter((_, i) => i !== index);
        setHoursArray(next);
        pushToForm(next);
    };

    return (
        <div className="flex flex-col gap-3">
            <Button type="button" variant="secondary" size="sm" className="w-fit" disabled={disabled} onClick={addEntry}>
                <Plus className="mr-1 h-4 w-4" />
                <Trans>Add hours</Trans>
            </Button>
            <div className="flex flex-col gap-2">
                {hoursArray.map((entry, i) => (
                    <div
                        key={i}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2"
                    >
                        <select
                            className="h-9 min-w-[120px] flex-1 rounded-md border border-input bg-background px-2 text-sm"
                            disabled={disabled}
                            value={entry.day ?? ''}
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
                            <option value="">{t`Opening`}</option>
                            {timeOptions.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="h-9 min-w-[100px] flex-1 rounded-md border border-input bg-background px-2 text-sm"
                            disabled={disabled}
                            value={entry.closingHour ?? ''}
                            onChange={e => updateEntry(i, { closingHour: e.target.value || null })}
                        >
                            <option value="">{t`Closing`}</option>
                            {timeOptions.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
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
        </div>
    );
};

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trans, useLingui } from '@lingui/react/macro';
import { StatCard } from './stat-card';

type Origin = 'all' | 'nationals' | 'internationals';
type Period = 'day' | 'night';

interface ActivitySectionProps {
  days?: number[] | null;
  visits?: number[] | null;
  total?: number | null;
  averageDuration?: number | null;
  origin: Origin;
  onPeriodChange: (period: Period) => void;
  onOriginChange: (origin: Origin) => void;
}

const originLabelKey: Record<string, string> = {
  all: 'Total',
  nationals: 'Nacional',
  internationals: 'Internacional',
};

export function ActivitySection({
  days,
  visits,
  total,
  averageDuration,
  origin,
  onPeriodChange,
  onOriginChange,
}: ActivitySectionProps) {
  const { t } = useLingui();
  const [period, setPeriod] = useState<Period>('day');

  const originLabel: Record<string, string> = {
    all: t`Total`,
    nationals: t`Nationals`,
    internationals: t`Internationals`,
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const chartData = (days ?? []).map((day, i) => ({ day: String(day), visits: visits?.[i] ?? 0 }));
  const formattedTotal = total ? total.toLocaleString('pt-PT') : '0';
  const formattedDuration = averageDuration ? `${averageDuration} ${t`Hours`}` : `0 ${t`Hours`}`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          <Trans>Activity</Trans> <span>ℹ️</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>Detail of visitor activity over the period</Trans>
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex rounded-md overflow-hidden border border-muted">
          <button
            className={`px-3 py-1.5 text-sm transition-colors ${period === 'day' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground] hover:bg-muted'}`}
            onClick={() => handlePeriodChange('day')}
          >
            <Trans>Day</Trans>
          </button>
          <button
            className={`px-3 py-1.5 text-sm transition-colors ${period === 'night' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
            onClick={() => handlePeriodChange('night')}
          >
            <Trans>Night</Trans>
          </button>
        </div>

        <div className="flex rounded-md overflow-hidden border border-muted">
          {(['all', 'nationals', 'internationals'] as Origin[]).map(o => (
            <button
              key={o}
              className={`px-3 py-1.5 text-sm transition-colors ${origin === o ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
              onClick={() => onOriginChange(o)}
            >
              {originLabel[o]}
            </button>
          ))}
        </div>
      </div>

      <h3 className="font-medium text-foreground]">
        <Trans>Visits per day ({originLabel[origin]})</Trans>
      </h3>

      <div className="rounded-lg border border-color-muted] bg-background p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v: number) => v.toLocaleString('pt-PT')}
            />
            <Tooltip formatter={(v: number) => v.toLocaleString('pt-PT')} />
            <Bar dataKey="visits" name={t`No. of visits`} fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title={t`Number of visits`} value={formattedTotal} />
        <StatCard title={t`Average length of stay`} value={formattedDuration} />
      </div>
    </div>
  );
}

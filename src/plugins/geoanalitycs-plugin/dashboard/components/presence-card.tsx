import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Trans } from '@lingui/react/macro';

interface PresenceCardProps {
  total?: number | null;
  residents?: number | null;
  regulars?: number | null;
  visitors?: { nacionais?: number | null; internacionais?: number | null } | null;
  tourists?: { nacionais?: number | null; internacionais?: number | null } | null;
}

export function PresenceCard({
  total = 0,
  residents = 0,
  regulars = 0,
  visitors,
  tourists,
}: PresenceCardProps) {
  const totalVal = total ?? 0;
  const nacionais = visitors?.nacionais ?? 0;
  const nacional = totalVal === 0 ? 0 : Math.round((nacionais / totalVal) * 100);
  const intl = totalVal === 0 ? 0 : 100 - nacional;

  const donutData = [
    { name: 'Nationals', value: nacional },
    { name: 'Internationals', value: intl },
  ];

  const COLORS = ['var(--primary)', 'var(--muted)'];

  return (
    <div className="rounded-lg border border-muted bg-background p-4 flex gap-6">
      <div className="flex flex-col items-center gap-2 min-w-[140px">
        <p className="text-xs text-muted-foreground">
          <Trans>Total presence</Trans>
        </p>
        <p className="text-2xl font-bold text-foreground">{totalVal.toLocaleString('pt-PT')}</p>
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value">
              {donutData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            <Trans>Nationals</Trans>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-muted" />
            <Trans>Internationals</Trans>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <div className="rounded border border-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            <Trans>Residents</Trans> ℹ️
          </p>
          <p className="text-lg font-bold text-foreground">{(residents ?? 0).toLocaleString('pt-PT')}</p>
        </div>

        <div className="rounded border border-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            <Trans>Regulars</Trans> ℹ️
          </p>
          <p className="text-lg font-bold text-foreground">{(regulars ?? 0).toLocaleString('pt-PT')}</p>
        </div>

        <div className="rounded border border-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            <Trans>Visitors</Trans> ℹ️
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                <Trans>Nationals</Trans>
              </p>
              <p className="font-bold text-foreground">
                {(visitors?.nacionais ?? 0).toLocaleString('pt-PT')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                <Trans>Internationals</Trans>
              </p>
              <p className="font-bold text-foreground">
                {(visitors?.internacionais ?? 0).toLocaleString('pt-PT')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded border border-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            <Trans>Tourists</Trans> ℹ️
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                <Trans>Nationals</Trans>
              </p>
              <p className="font-bold text-foreground">
                {(tourists?.nacionais ?? 0).toLocaleString('pt-PT')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                <Trans>Internationals</Trans>
              </p>
              <p className="font-bold text-foreground">
                {(tourists?.internacionais ?? 0).toLocaleString('pt-PT')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

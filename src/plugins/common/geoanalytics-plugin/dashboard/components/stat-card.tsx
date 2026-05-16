interface StatCardProps {
  title: string;
  date?: string | null;
  value?: number | string | null;
}

export function StatCard({ title, date, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-color-muted bg-background p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">KPI</span>
      </div>
      <p className="text-xs text-muted-foreground">{date ?? ' '}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-foreground">{value ?? '—'}</span>
        <span className="text-2xl">👥</span>
      </div>
    </div>
  );
}

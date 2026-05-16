import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  title: string;
  labels?: string[] | null;
  data?: number[] | null;
}

export function LineChart({ title, labels, data }: LineChartProps) {
  const chartData = (labels ?? []).map((label, i) => ({ label, visits: data?.[i] ?? 0 }));

  return (
    <div className="rounded-lg border border-muted bg-background p-4">
      <h3 className="font-medium text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
          <XAxis
            dataKey="label"
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
          <Line
            type="monotone"
            dataKey="visits"
            name="Nº de visitas"
            stroke="var(--primary)"
            fill="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

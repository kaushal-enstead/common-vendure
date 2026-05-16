import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutChartCardProps {
  title: string;
  labels: string[];
  data: number[];
}

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--muted)'];

export function DonutChartCard({ title, labels, data }: DonutChartCardProps) {
  const chartData = labels.map((label, i) => ({ name: label, value: data[i] ?? 0 }));

  return (
    <div className="rounded-lg border border-color-muted bg-background p-4 flex-1">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-foreground">{title}</span>
        <span title="Mais informações">ℹ️</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value.toLocaleString('pt-PT'), name]} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

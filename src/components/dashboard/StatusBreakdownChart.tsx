import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatusBreakdownChartProps {
  statusBreakdown: { success: number; sourceDown: number; notFound: number; otherError: number };
  statusTimeline: { date: string; success: number; sourceDown: number; notFound: number; otherError: number }[];
}

const categories = [
  { key: 'success', label: 'Success', color: 'hsl(var(--success))' },
  { key: 'sourceDown', label: 'Source Down', color: 'hsl(var(--warning))' },
  { key: 'notFound', label: 'Not Found', color: 'hsl(var(--chart-4))' },
  { key: 'otherError', label: 'Other Error', color: 'hsl(var(--destructive))' },
] as const;

export function StatusBreakdownChart({ statusBreakdown, statusTimeline }: StatusBreakdownChartProps) {
  const total = statusBreakdown.success + statusBreakdown.sourceDown + statusBreakdown.notFound + statusBreakdown.otherError;

  const breakdownItems = categories.map(cat => ({
    ...cat,
    value: statusBreakdown[cat.key],
    percent: ((statusBreakdown[cat.key] / total) * 100).toFixed(1),
  }));

  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status Breakdown</h3>

        {/* Stacked bar */}
        <div className="h-3 rounded-full overflow-hidden flex mb-4">
          {breakdownItems.map(item => (
            <div
              key={item.key}
              style={{ width: `${item.percent}%`, backgroundColor: item.color }}
              className="h-full transition-all"
            />
          ))}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 gap-3">
          {breakdownItems.map(item => (
            <div key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{formatCalls(item.value)}</span>
                  <span className="text-xs text-muted-foreground">{item.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Trends Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statusTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCalls}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
              />
              <Area type="monotone" dataKey="success" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} name="Success" />
              <Area type="monotone" dataKey="sourceDown" stackId="1" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.6} name="Source Down" />
              <Area type="monotone" dataKey="notFound" stackId="1" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.6} name="Not Found" />
              <Area type="monotone" dataKey="otherError" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Other Error" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

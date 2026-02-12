import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

export type UsageSource = 'overall' | 'internal' | 'external';

interface UsageChartProps {
  dailyData: { date: string; calls: number }[];
  weeklyData: { week: string; calls: number }[];
  monthlyData: { month: string; calls: number; previousYear: number }[];
  title?: string;
  usageSource?: UsageSource;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';
type ChartType = 'area' | 'bar';

// Deterministic split: use a simple hash of the date string to get consistent internal ratio
function splitCalls(calls: number, key: string): { internal: number; external: number } {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const ratio = 0.3 + (Math.abs(hash) % 20) / 100;
  const internal = Math.round(calls * ratio);
  return { internal, external: calls - internal };
}

export function UsageChart({ dailyData, weeklyData, monthlyData, title = 'API Usage', usageSource = 'overall' }: UsageChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [chartType, setChartType] = useState<ChartType>('area');

  const getData = () => {
    let rawData: any[];
    let key: string;
    switch (timeRange) {
      case 'daily': rawData = dailyData; key = 'date'; break;
      case 'weekly': rawData = weeklyData; key = 'week'; break;
      case 'monthly': rawData = monthlyData; key = 'month'; break;
    }

    if (usageSource === 'overall') return rawData;

    return rawData.map((item: any) => {
      const { internal, external } = splitCalls(item.calls, item[key]);
      const filtered = { ...item, calls: usageSource === 'internal' ? internal : external };
      if (item.previousYear !== undefined) {
        const prev = splitCalls(item.previousYear, item[key] + '_prev');
        filtered.previousYear = usageSource === 'internal' ? prev.internal : prev.external;
      }
      return filtered;
    });
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatYAxis(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const data = getData();
  const xKey = timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month';

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-muted rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex bg-muted rounded-lg p-1">
            {(['area', 'bar'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  chartType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
               <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 16%, 47%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(215, 16%, 47%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey={xKey}
                className="fill-muted-foreground"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              {timeRange === 'monthly' && (
                <Area
                  type="monotone"
                  dataKey="previousYear"
                  name="Previous Year"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrevious)"
                />
              )}
              <Area
                type="monotone"
                dataKey="calls"
                name="Current"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCalls)"
              />
              {timeRange === 'monthly' && <Legend />}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              {timeRange === 'monthly' && (
                <Bar
                  dataKey="previousYear"
                  name="Previous Year"
                  fill="hsl(var(--muted-foreground))"
                  radius={[4, 4, 0, 0]}
                />
              )}
              <Bar
                dataKey="calls"
                name="Current"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              {timeRange === 'monthly' && <Legend />}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

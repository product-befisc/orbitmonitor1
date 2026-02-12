import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';
import type { UsageSource } from './UsageChart';

export type QuickFilter = '3m' | '6m';

interface StatusDayData {
  date: string;
  success: number;
  sourceDown: number;
  notFound: number;
  timeout: number;
  otherError: number;
  total: number;
}

interface APIConsumptionChartProps {
  apis: APIData[];
  usageSource: UsageSource;
  onDayClick: (dayData: StatusDayData, allAPIs: APIData[]) => void;
}

// Deterministic split for internal/external
function splitValue(value: number, key: string): { internal: number; external: number } {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const ratio = 0.3 + (Math.abs(hash) % 20) / 100;
  const internal = Math.round(value * ratio);
  return { internal, external: value - internal };
}

const STATUS_COLORS = {
  success: 'hsl(var(--success))',
  sourceDown: 'hsl(var(--warning))',
  notFound: 'hsl(var(--chart-4))',
  timeout: 'hsl(var(--chart-3))',
  otherError: 'hsl(var(--destructive))',
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  sourceDown: 'Source Down',
  notFound: 'Not Found',
  timeout: 'Timeout',
  otherError: 'Other Errors',
};

export function APIConsumptionChart({ apis, usageSource, onDayClick }: APIConsumptionChartProps) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('3m');
  const [hiddenStatus, setHiddenStatus] = useState<Set<string>>(new Set());

  const dailyStatusData = useMemo(() => {
    const dataMap = new Map<string, StatusDayData>();

    apis.forEach(api => {
      api.statusTimeline.forEach(day => {
        const existing = dataMap.get(day.date) || {
          date: day.date,
          success: 0,
          sourceDown: 0,
          notFound: 0,
          timeout: 0,
          otherError: 0,
          total: 0,
        };
        existing.success += day.success;
        existing.sourceDown += day.sourceDown;
        existing.notFound += day.notFound;
        // Simulate timeout from otherError split
        const timeoutPart = Math.round(day.otherError * 0.4);
        existing.timeout += timeoutPart;
        existing.otherError += day.otherError - timeoutPart;
        existing.total += day.success + day.sourceDown + day.notFound + day.otherError;
        dataMap.set(day.date, existing);
      });
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [apis]);

  const filteredData = useMemo(() => {
    const sliceCount = quickFilter === '3m' ? dailyStatusData.length : dailyStatusData.length; // all 30 days available
    let data = dailyStatusData.slice(-sliceCount);

    if (usageSource !== 'overall') {
      data = data.map(d => {
        const s = splitValue(d.success, d.date + 'success');
        const sd = splitValue(d.sourceDown, d.date + 'sourceDown');
        const nf = splitValue(d.notFound, d.date + 'notFound');
        const to = splitValue(d.timeout, d.date + 'timeout');
        const oe = splitValue(d.otherError, d.date + 'otherError');
        const pick = usageSource === 'internal' ? 'internal' : 'external';
        const success = s[pick]; const sourceDown = sd[pick]; const notFound = nf[pick]; 
        const timeout = to[pick]; const otherError = oe[pick];
        return { ...d, success, sourceDown, notFound, timeout, otherError, total: success + sourceDown + notFound + timeout + otherError };
      });
    }
    return data;
  }, [dailyStatusData, quickFilter, usageSource]);

  // Summary stats
  const summary = useMemo(() => {
    const totals = filteredData.reduce((acc, d) => ({
      total: acc.total + d.total,
      success: acc.success + d.success,
      sourceDown: acc.sourceDown + d.sourceDown,
      notFound: acc.notFound + d.notFound,
      timeout: acc.timeout + d.timeout,
      otherError: acc.otherError + d.otherError,
    }), { total: 0, success: 0, sourceDown: 0, notFound: 0, timeout: 0, otherError: 0 });

    const failures = totals.total - totals.success;
    return {
      totalCalls: totals.total,
      successPct: totals.total > 0 ? (totals.success / totals.total * 100) : 0,
      failurePct: totals.total > 0 ? (failures / totals.total * 100) : 0,
      sourceDownPct: totals.total > 0 ? (totals.sourceDown / totals.total * 100) : 0,
      errorRatePct: totals.total > 0 ? ((totals.otherError + totals.timeout + totals.notFound) / totals.total * 100) : 0,
    };
  }, [filteredData]);

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  const formatYAxis = (v: number) => formatNum(v);

  const toggleStatus = (key: string) => {
    setHiddenStatus(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const statusKeys = ['success', 'sourceDown', 'notFound', 'timeout', 'otherError'] as const;
  const visibleKeys = statusKeys.filter(k => !hiddenStatus.has(k));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
            {STATUS_LABELS[entry.dataKey] || entry.dataKey}: {formatNum(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const summaryCards = [
    { label: 'Total Calls', value: formatNum(summary.totalCalls), color: 'text-foreground' },
    { label: 'Success', value: `${summary.successPct.toFixed(1)}%`, color: 'text-success' },
    { label: 'Failure', value: `${summary.failurePct.toFixed(1)}%`, color: 'text-destructive' },
    { label: 'Source Down', value: `${summary.sourceDownPct.toFixed(1)}%`, color: 'text-warning' },
    { label: 'Error Rate', value: `${summary.errorRatePct.toFixed(1)}%`, color: 'text-destructive' },
  ];

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{card.label}</p>
            <p className={cn('text-xl font-bold mt-0.5', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Header with quick filters */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">API Consumption</h3>
        <div className="flex bg-muted rounded-lg p-0.5">
          {([['3m', 'Last 3 Months'], ['6m', 'Last 6 Months']] as [QuickFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setQuickFilter(key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                quickFilter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusKeys.map(key => (
          <button
            key={key}
            onClick={() => toggleStatus(key)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              hiddenStatus.has(key)
                ? 'opacity-40 border-border'
                : 'border-transparent bg-muted'
            )}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }} />
            {STATUS_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-72 sm:h-80 overflow-x-auto">
        <div className="min-w-[600px] h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(data) => {
                if (data?.activePayload?.[0]?.payload) {
                  onDayClick(data.activePayload[0].payload, apis);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              {visibleKeys.map(key => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="status"
                  fill={STATUS_COLORS[key]}
                  radius={key === visibleKeys[visibleKeys.length - 1] ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export type { StatusDayData };

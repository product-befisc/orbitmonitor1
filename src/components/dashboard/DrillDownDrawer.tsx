import { useState, useMemo } from 'react';
import { X, Download, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import type { StatusDayData } from './APIConsumptionChart';

interface DrillDownDrawerProps {
  dayData: StatusDayData;
  apis: APIData[];
  open: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
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

type SortKey = 'name' | 'total' | 'success' | 'sourceDown' | 'notFound' | 'timeout' | 'failurePct' | 'avgResponseTime';

export function DrillDownDrawer({ dayData, apis, open, onClose }: DrillDownDrawerProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const successRate = dayData.total > 0 ? (dayData.success / dayData.total * 100) : 0;
  const failureRate = 100 - successRate;

  // Donut data
  const donutData = [
    { name: 'Success', value: dayData.success, color: STATUS_COLORS.success },
    { name: 'Source Down', value: dayData.sourceDown, color: STATUS_COLORS.sourceDown },
    { name: 'Not Found', value: dayData.notFound, color: STATUS_COLORS.notFound },
    { name: 'Timeout', value: dayData.timeout, color: STATUS_COLORS.timeout },
    { name: 'Other Errors', value: dayData.otherError, color: STATUS_COLORS.otherError },
  ].filter(d => d.value > 0);

  // Status breakdown table data
  const breakdownRows = [
    { key: 'success', count: dayData.success },
    { key: 'sourceDown', count: dayData.sourceDown },
    { key: 'notFound', count: dayData.notFound },
    { key: 'timeout', count: dayData.timeout },
    { key: 'otherError', count: dayData.otherError },
  ];

  interface APIBreakdownItem {
    id: string;
    name: string;
    client: string;
    total: number;
    success: number;
    sourceDown: number;
    notFound: number;
    timeout: number;
    otherError: number;
    failurePct: number;
    avgResponseTime: number;
  }

  // API-level breakdown
  const apiBreakdown = useMemo((): APIBreakdownItem[] => {
    const dayDate = dayData.date;
    const result: APIBreakdownItem[] = [];
    apis.forEach(api => {
      const dayEntry = api.statusTimeline.find(d => d.date === dayDate);
      if (!dayEntry) return;
      const total = dayEntry.success + dayEntry.sourceDown + dayEntry.notFound + dayEntry.otherError;
      const timeoutPart = Math.round(dayEntry.otherError * 0.4);
      const otherPart = dayEntry.otherError - timeoutPart;
      const failures = total - dayEntry.success;
      result.push({
        id: api.id,
        name: api.name,
        client: api.client,
        total,
        success: dayEntry.success,
        sourceDown: dayEntry.sourceDown,
        notFound: dayEntry.notFound,
        timeout: timeoutPart,
        otherError: otherPart,
        failurePct: total > 0 ? (failures / total * 100) : 0,
        avgResponseTime: Math.round(50 + Math.random() * 450),
      });
    });
    return result;
  }, [apis, dayData.date]);

  const filteredAPIs = useMemo(() => {
    let result = apiBreakdown.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.client.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [apiBreakdown, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['API Name', 'Client', 'Total Calls', 'Success', 'Source Down', 'Not Found', 'Timeout', 'Failure %', 'Avg Response Time (ms)'];
    const rows = filteredAPIs.map(a => [
      a.name, a.client, a.total, a.success, a.sourceDown, a.notFound, a.timeout, a.failurePct.toFixed(1), a.avgResponseTime
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-breakdown-${dayData.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (!open) return null;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold">Daily Drill-Down</h2>
          <p className="text-sm text-muted-foreground">{dayData.date}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* A. Daily Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Calls</p>
            <p className="text-2xl font-bold mt-0.5">{formatNum(dayData.total)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Success Rate</p>
            <p className="text-2xl font-bold mt-0.5 text-success">{successRate.toFixed(1)}%</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Failure Rate</p>
            <p className="text-2xl font-bold mt-0.5 text-destructive">{failureRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* B. Status Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Breakdown</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Donut */}
            <div className="w-full sm:w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown table */}
            <div className="flex-1 space-y-1.5">
              {breakdownRows.map(row => (
                <div key={row.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[row.key] }} />
                  <span className="text-sm flex-1">{STATUS_LABELS[row.key]}</span>
                  <span className="text-sm font-semibold">{formatNum(row.count)}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {dayData.total > 0 ? (row.count / dayData.total * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C. API-Level Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">API-Level Breakdown</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter APIs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-44"
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1 text-xs h-8">
                <Download className="w-3 h-3" />
                CSV
              </Button>
            </div>
          </div>

          {/* Table - desktop */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {[
                    { key: 'name' as SortKey, label: 'API Name' },
                    { key: 'total' as SortKey, label: 'Total' },
                    { key: 'success' as SortKey, label: 'Success' },
                    { key: 'sourceDown' as SortKey, label: 'Src Down' },
                    { key: 'notFound' as SortKey, label: 'Not Found' },
                    { key: 'timeout' as SortKey, label: 'Timeout' },
                    { key: 'failurePct' as SortKey, label: 'Failure %' },
                    { key: 'avgResponseTime' as SortKey, label: 'Avg RT' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAPIs.slice(0, 50).map(api => (
                  <tr key={api.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]">{api.name}</td>
                    <td className="px-3 py-2 font-medium">{formatNum(api.total)}</td>
                    <td className="px-3 py-2 text-success">{formatNum(api.success)}</td>
                    <td className="px-3 py-2 text-warning">{formatNum(api.sourceDown)}</td>
                    <td className="px-3 py-2">{formatNum(api.notFound)}</td>
                    <td className="px-3 py-2">{formatNum(api.timeout)}</td>
                    <td className={cn('px-3 py-2 font-medium', api.failurePct > 20 ? 'text-destructive' : api.failurePct > 10 ? 'text-warning' : 'text-success')}>
                      {api.failurePct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{api.avgResponseTime}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards - mobile */}
          <div className="md:hidden space-y-2 max-h-[400px] overflow-y-auto">
            {filteredAPIs.slice(0, 30).map(api => (
              <div key={api.id} className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                <p className="font-mono text-sm font-medium truncate">{api.name}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatNum(api.total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success</p>
                    <p className="font-semibold text-success">{formatNum(api.success)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failure</p>
                    <p className={cn('font-semibold', api.failurePct > 20 ? 'text-destructive' : 'text-warning')}>
                      {api.failurePct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAPIs.length > 50 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Showing 50 of {filteredAPIs.length} APIs
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: full-screen modal. Desktop: side drawer
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background animate-fade-in">
        {content}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[600px] max-w-[90vw] bg-background border-l border-border shadow-2xl animate-slide-in-right">
        {content}
      </div>
    </>
  );
}

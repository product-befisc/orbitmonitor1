import { useState, useMemo } from 'react';
import { ArrowLeft, DollarSign, TrendingDown, ChevronRight, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend
} from 'recharts';

interface RevenueDetailViewProps {
  apis: APIData[];
  onBack: () => void;
}

const RATE_PER_CALL = 0.012; // revenue per API call

export function RevenueDetailView({ apis, onBack }: RevenueDetailViewProps) {
  const [dateRange, setDateRange] = useState<string>('this-month');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Calculate source-down revenue loss per API per day
  const apiRevenueLoss = useMemo(() => {
    return apis.map(api => {
      const totalSourceDown = api.statusBreakdown.sourceDown;
      const revenueLoss = totalSourceDown * RATE_PER_CALL;
      const perDayLoss = api.statusTimeline.map(d => ({
        date: d.date,
        sourceDown: d.sourceDown,
        revenueLoss: d.sourceDown * RATE_PER_CALL,
      }));
      return { api, totalSourceDown, revenueLoss, perDayLoss };
    }).filter(a => a.totalSourceDown > 0)
      .sort((a, b) => b.revenueLoss - a.revenueLoss);
  }, [apis]);

  const totalRevenueLoss = apiRevenueLoss.reduce((s, a) => s + a.revenueLoss, 0);

  // Client-wise aggregation
  const clientRevenue = useMemo(() => {
    const map = new Map<string, { client: string; revenueLoss: number; sourceDown: number; apiCount: number }>();
    apiRevenueLoss.forEach(({ api, totalSourceDown, revenueLoss }) => {
      const existing = map.get(api.client) || { client: api.client, revenueLoss: 0, sourceDown: 0, apiCount: 0 };
      existing.revenueLoss += revenueLoss;
      existing.sourceDown += totalSourceDown;
      existing.apiCount += 1;
      map.set(api.client, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.revenueLoss - a.revenueLoss);
  }, [apiRevenueLoss]);

  // Daily aggregated data for the main chart
  const dailyChartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; sourceDown: number; revenueLoss: number }>();
    apiRevenueLoss.forEach(({ perDayLoss }) => {
      perDayLoss.forEach(d => {
        const existing = dayMap.get(d.date) || { date: d.date, sourceDown: 0, revenueLoss: 0 };
        existing.sourceDown += d.sourceDown;
        existing.revenueLoss += d.revenueLoss;
        dayMap.set(d.date, existing);
      });
    });
    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [apiRevenueLoss]);

  // APIs for a selected day
  const dayAPIs = useMemo(() => {
    if (!selectedDay) return [];
    return apiRevenueLoss
      .map(({ api, perDayLoss }) => {
        const dayData = perDayLoss.find(d => d.date === selectedDay);
        if (!dayData || dayData.sourceDown === 0) return null;
        return {
          id: api.id,
          name: api.name,
          client: api.client,
          sourceDown: dayData.sourceDown,
          revenueLoss: dayData.revenueLoss,
          contribution: 0,
        };
      })
      .filter(Boolean) as { id: string; name: string; client: string; sourceDown: number; revenueLoss: number; contribution: number }[];
  }, [selectedDay, apiRevenueLoss]);

  // Calculate contribution percentages
  const dayAPIsWithContribution = useMemo(() => {
    const totalDayLoss = dayAPIs.reduce((s, a) => s + a.revenueLoss, 0);
    return dayAPIs
      .map(a => ({ ...a, contribution: totalDayLoss > 0 ? (a.revenueLoss / totalDayLoss) * 100 : 0 }))
      .sort((a, b) => b.revenueLoss - a.revenueLoss);
  }, [dayAPIs]);

  const formatCurrency = (val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(2)}`;
  const formatCount = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toString();

  const chartDataKey = 'revenueLoss';
  const chartLabel = 'Revenue Loss';

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Revenue Loss Analysis</h1>
            <p className="text-sm text-muted-foreground">
              Due to source-down APIs in the last 24 hours
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Total Revenue Loss</p>
          <p className="text-3xl font-semibold text-destructive">{formatCurrency(totalRevenueLoss)}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Affected APIs</p>
          <p className="text-3xl font-semibold">{apiRevenueLoss.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Affected Clients</p>
          <p className="text-3xl font-semibold">{clientRevenue.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Total Source Down</p>
          <p className="text-3xl font-semibold">{formatCount(apiRevenueLoss.reduce((s, a) => s + a.totalSourceDown, 0))}</p>
        </div>
      </div>

      {/* Main Chart with date range */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Daily {chartLabel}</h2>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="3-months">Last 3 Months</SelectItem>
              <SelectItem value="6-months">Last 6 Months</SelectItem>
              <SelectItem value="1-year">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Click on any bar to see API-wise breakdown</p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} onClick={(e) => {
              if (e?.activeLabel) setSelectedDay(e.activeLabel as string);
            }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelFormatter={(d) => new Date(d as string).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                formatter={(value: number) => [formatCurrency(value), chartLabel]}
              />
              <Bar dataKey={chartDataKey} radius={[4, 4, 0, 0]} cursor="pointer">
                {dailyChartData.map((entry) => (
                  <Cell
                    key={entry.date}
                    fill={entry.date === selectedDay ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                    fillOpacity={entry.date === selectedDay ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two columns: Client-wise + API-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Client-wise */}
        <div className="glass-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Client-wise Revenue Loss</h3>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {clientRevenue.map(c => (
              <div key={c.client} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.client}</p>
                  <p className="text-xs text-muted-foreground">{c.apiCount} APIs · {formatCount(c.sourceDown)} source down</p>
                </div>
                <span className="font-semibold text-destructive">{formatCurrency(c.revenueLoss)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API-wise */}
        <div className="glass-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Top APIs by Revenue Loss</h3>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {apiRevenueLoss.slice(0, 15).map(({ api, revenueLoss, totalSourceDown }) => (
              <div key={api.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{api.name}</p>
                  <p className="text-xs text-muted-foreground">{api.client} · {formatCount(totalSourceDown)} down</p>
                </div>
                <span className="font-semibold text-destructive flex-shrink-0">{formatCurrency(revenueLoss)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client-wise bar chart */}
      <div className="glass-card p-5 mb-6">
        <h2 className="font-semibold text-lg mb-4">Client-wise {chartLabel}</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
              />
              <YAxis
                type="category"
                dataKey="client"
                width={100}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatCurrency(value), chartLabel]}
              />
              <Bar
                dataKey="revenueLoss"
                fill="hsl(var(--destructive))"
                fillOpacity={0.8}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day drill-down drawer */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-semibold text-lg">
                  {new Date(selectedDay).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {dayAPIsWithContribution.length} APIs · Total: {formatCurrency(dayAPIs.reduce((s, a) => s + a.revenueLoss, 0))}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="divide-y divide-border">
              {dayAPIsWithContribution.map(api => (
                <div key={api.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-medium truncate">{api.name}</p>
                    <span className="font-semibold text-destructive">{formatCurrency(api.revenueLoss)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{api.client}</span>
                    <span>{formatCount(api.sourceDown)} source down</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive rounded-full transition-all"
                        style={{ width: `${Math.min(api.contribution, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-12 text-right">
                      {api.contribution.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}

              {dayAPIsWithContribution.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  No source-down events on this day.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

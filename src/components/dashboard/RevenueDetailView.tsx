import { useState, useMemo } from 'react';
import { ArrowLeft, DollarSign, TrendingDown, ChevronDown, ChevronRight, X, Calendar } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

  // APIs for a selected day, grouped by client
  const dayClientGroups = useMemo(() => {
    if (!selectedDay) return [];
    const clientMap = new Map<string, { client: string; revenueLoss: number; sourceDown: number; apis: { id: string; name: string; sourceDown: number; revenueLoss: number }[] }>();
    apiRevenueLoss.forEach(({ api, perDayLoss }) => {
      const dayData = perDayLoss.find(d => d.date === selectedDay);
      if (!dayData || dayData.sourceDown === 0) return;
      const existing = clientMap.get(api.client) || { client: api.client, revenueLoss: 0, sourceDown: 0, apis: [] };
      existing.revenueLoss += dayData.revenueLoss;
      existing.sourceDown += dayData.sourceDown;
      existing.apis.push({ id: api.id, name: api.name, sourceDown: dayData.sourceDown, revenueLoss: dayData.revenueLoss });
      clientMap.set(api.client, existing);
    });
    const groups = Array.from(clientMap.values()).sort((a, b) => b.revenueLoss - a.revenueLoss);
    // Sort APIs within each group
    groups.forEach(g => g.apis.sort((a, b) => b.revenueLoss - a.revenueLoss));
    return groups;
  }, [selectedDay, apiRevenueLoss]);

  const totalDayLoss = dayClientGroups.reduce((s, g) => s + g.revenueLoss, 0);
  const totalDayAPIs = dayClientGroups.reduce((s, g) => s + g.apis.length, 0);
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
                  {dayClientGroups.length} clients · {totalDayAPIs} APIs · {formatCurrency(totalDayLoss)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Summary row */}
            {dayClientGroups.length > 0 && (
              <div className="grid grid-cols-3 gap-3 p-4 border-b border-border bg-muted/30">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Loss</p>
                  <p className="text-lg font-semibold text-destructive">{formatCurrency(totalDayLoss)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Source Down</p>
                  <p className="text-lg font-semibold">{formatCount(dayClientGroups.reduce((s, g) => s + g.sourceDown, 0))}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Clients</p>
                  <p className="text-lg font-semibold">{dayClientGroups.length}</p>
                </div>
              </div>
            )}

            <div className="p-3 space-y-2">
              {dayClientGroups.map(group => {
                const clientContribution = totalDayLoss > 0 ? (group.revenueLoss / totalDayLoss) * 100 : 0;
                return (
                  <Collapsible key={group.client} defaultOpen={dayClientGroups.length <= 3}>
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=closed]_&]:-rotate-90 flex-shrink-0" />
                            <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                            <p className="font-semibold truncate text-left">{group.client}</p>
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">{group.apis.length} APIs</Badge>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-semibold text-destructive">{formatCurrency(group.revenueLoss)}</p>
                            <p className="text-[10px] text-muted-foreground">{clientContribution.toFixed(1)}% of total</p>
                          </div>
                        </div>
                        {/* Client contribution bar */}
                        <div className="px-4 pb-2">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-destructive/70 rounded-full transition-all" style={{ width: `${Math.min(clientContribution, 100)}%` }} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border divide-y divide-border/50">
                          {group.apis.map(api => {
                            const apiContrib = group.revenueLoss > 0 ? (api.revenueLoss / group.revenueLoss) * 100 : 0;
                            return (
                              <div key={api.id} className="px-4 py-2.5 flex items-start justify-between hover:bg-muted/30 transition-colors ml-8">
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono text-sm truncate">{api.name}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <TrendingDown className="w-3 h-3" />
                                      {formatCount(api.sourceDown)} down
                                    </span>
                                    <span>{apiContrib.toFixed(1)}% of client</span>
                                  </div>
                                </div>
                                <span className="font-semibold text-destructive text-sm flex-shrink-0 ml-3">{formatCurrency(api.revenueLoss)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}

              {dayClientGroups.length === 0 && (
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

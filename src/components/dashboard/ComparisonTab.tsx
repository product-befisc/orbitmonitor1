import { useState, useMemo } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X, BarChart3, Users, Code2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { APIData } from '@/lib/mockData';
import { getClientUsageData } from '@/lib/mockData';

type CompareMode = 'clients' | 'apis';
type DatePreset = 'current-vs-previous' | 'custom';

interface ComparisonTabProps {
  apis: APIData[];
}

export function ComparisonTab({ apis }: ComparisonTabProps) {
  const [mode, setMode] = useState<CompareMode>('clients');
  const [datePreset, setDatePreset] = useState<DatePreset>('current-vs-previous');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>([]);

  const clients = useMemo(() => {
    const clientData = getClientUsageData(apis);
    return clientData.map(c => c.client);
  }, [apis]);

  const apiNames = useMemo(() => [...new Set(apis.map(a => a.name))], [apis]);

  const toggleClient = (client: string) => {
    setSelectedClients(prev =>
      prev.includes(client) ? prev.filter(c => c !== client) : [...prev, client]
    );
  };

  const toggleAPI = (api: string) => {
    setSelectedAPIs(prev =>
      prev.includes(api) ? prev.filter(a => a !== api) : [...prev, api]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Build comparison chart data — always include current & previous
  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));

    const computeVolumes = (relevantAPIs: APIData[]) => {
      let currentVolume = 0;
      let previousVolume = 0;

      relevantAPIs.forEach(api => {
        api.dailyData.forEach(d => {
          const date = new Date(d.date);
          if (datePreset === 'custom' && customFrom && customTo) {
            if (date >= customFrom && date <= customTo) currentVolume += d.calls;
          } else {
            if (date >= currentMonthStart && date <= now) currentVolume += d.calls;
            const dayOfMonth = date.getDate();
            if (date >= prevMonthStart && date < currentMonthStart && dayOfMonth <= now.getDate()) {
              previousVolume += d.calls;
            }
          }
        });
      });

      return { currentVolume, previousVolume };
    };

    if (mode === 'clients') {
      if (selectedClients.length === 0) return [];
      return selectedClients.map(client => {
        const clientAPIs = apis.filter(a => a.client === client);
        const { currentVolume, previousVolume } = computeVolumes(clientAPIs);
        const change = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;
        return { name: client, current: currentVolume, previous: previousVolume, change };
      });
    } else {
      if (selectedAPIs.length === 0) return [];
      return selectedAPIs.map(apiName => {
        const matchingAPIs = apis.filter(a => a.name === apiName);
        const { currentVolume, previousVolume } = computeVolumes(matchingAPIs);
        const change = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;
        return { name: apiName, current: currentVolume, previous: previousVolume, change };
      });
    }
  }, [mode, selectedClients, selectedAPIs, apis, datePreset, customFrom, customTo]);

  const items = mode === 'clients' ? clients : apiNames;
  const selected = mode === 'clients' ? selectedClients : selectedAPIs;
  const toggle = mode === 'clients' ? toggleClient : toggleAPI;

  return (
    <div className="space-y-5">
      {/* Top controls row */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start">
        {/* Left: Mode + Date controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('clients'); setSelectedAPIs([]); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                mode === 'clients'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/30'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Clients
            </button>
            <button
              onClick={() => { setMode('apis'); setSelectedClients([]); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                mode === 'apis'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/30'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              APIs
            </button>
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Date preset */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setDatePreset('current-vs-previous')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                datePreset === 'current-vs-previous' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Current vs Previous
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                datePreset === 'custom' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Custom Range
            </button>
          </div>

          {datePreset === 'custom' && (
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {customFrom ? format(customFrom, 'MMM d') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">–</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {customTo ? format(customTo, 'MMM d') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Right: selected count summary */}
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{selected.length} {mode === 'clients' ? 'client' : 'API'}{selected.length !== 1 ? 's' : ''} selected</span>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => mode === 'clients' ? setSelectedClients([]) : setSelectedAPIs([])}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Selection chips */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Select {mode === 'clients' ? 'Clients' : 'APIs'} to Compare
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {items.map(item => (
              <button
                key={item}
                onClick={() => toggle(item)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  selected.includes(item)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted'
                )}
              >
                {item}
                {selected.includes(item) && <X className="w-3 h-3 ml-0.5" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart + summary cards */}
      {chartData.length > 0 ? (
        <div className="space-y-5">
          {/* Bar chart — always shows current & previous side by side */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Usage Volume Comparison</CardTitle>
                  <CardDescription className="text-xs">
                    {datePreset === 'current-vs-previous'
                      ? 'Current month (blue) vs Previous month (gray) — same date range'
                      : 'Selected date range volume'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                    Current
                  </span>
                  {datePreset === 'current-vs-previous' && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-muted-foreground/40 inline-block" />
                      Previous
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      angle={chartData.length > 5 ? -20 : 0}
                      textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                      height={chartData.length > 5 ? 60 : 30}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={v => formatNumber(v)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      formatter={(value: number, name: string) => [value.toLocaleString(), name === 'previous' ? 'Previous Month' : 'Current Month']}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                    />
                    <Bar dataKey="previous" name="Previous Month" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" name="Current Month" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {chartData.map(item => {
              const isUp = item.change >= 0;
              return (
                <Card key={item.name} className="glass-card">
                  <CardContent className="p-4">
                    <p className="font-medium text-sm truncate mb-3">{item.name}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Current</p>
                        <p className="text-lg font-bold text-primary">{formatNumber(item.current)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Previous</p>
                        <p className="text-lg font-bold text-muted-foreground">{formatNumber(item.previous)}</p>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 mt-3 text-xs font-medium',
                      isUp ? 'text-success' : 'text-destructive'
                    )}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isUp ? '+' : ''}{item.change.toFixed(1)}% change
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Select {mode === 'clients' ? 'clients' : 'APIs'} above to compare their usage volumes
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Click on any chip to add it to comparison
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

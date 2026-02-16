import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Calendar as CalendarIcon, X, BarChart3, Users, Code2, TrendingUp, TrendingDown, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { APIData } from '@/lib/mockData';
import { getClientUsageData } from '@/lib/mockData';

type CompareMode = 'clients' | 'apis';
type DatePreset = 'current-vs-previous' | 'custom';

interface ComparisonTabProps {
  apis: APIData[];
}

interface DetailItem {
  name: string;
  current: number;
  previous: number;
  change: number;
}

const STATUS_COLORS = {
  success: 'hsl(var(--success))',
  sourceDown: 'hsl(var(--warning))',
  notFound: 'hsl(var(--chart-4))',
  otherError: 'hsl(var(--destructive))',
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  sourceDown: 'Source Down',
  notFound: 'Not Found',
  otherError: 'Other Errors',
};

export function ComparisonTab({ apis }: ComparisonTabProps) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<CompareMode>('clients');
  const [datePreset, setDatePreset] = useState<DatePreset>('current-vs-previous');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [initialized, setInitialized] = useState({ clients: false, apis: false });

  const clientDataSorted = useMemo(() => {
    const clientData = getClientUsageData(apis);
    return clientData.sort((a, b) => b.totalCalls - a.totalCalls);
  }, [apis]);

  const clients = useMemo(() => clientDataSorted.map(c => c.client), [clientDataSorted]);

  const apisSorted = useMemo(() =>
    [...apis].sort((a, b) => b.currentCalls - a.currentCalls),
    [apis]
  );
  const apiNames = useMemo(() => {
    const seen = new Set<string>();
    return apisSorted.filter(a => { if (seen.has(a.name)) return false; seen.add(a.name); return true; }).map(a => a.name);
  }, [apisSorted]);

  // Auto-select top 5 on first render for each mode
  if (mode === 'clients' && !initialized.clients && clients.length > 0) {
    setSelectedClients(clients.slice(0, 5));
    setInitialized(prev => ({ ...prev, clients: true }));
  }
  if (mode === 'apis' && !initialized.apis && apiNames.length > 0) {
    setSelectedAPIs(apiNames.slice(0, 5));
    setInitialized(prev => ({ ...prev, apis: true }));
  }

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

  // Compute aggregate default data
  const aggregateData = useMemo(() => {
    let currentVolume = 0;
    let previousVolume = 0;
    apis.forEach(api => {
      api.dailyData.forEach(d => {
        currentVolume += d.calls;
        previousVolume += d.previousCalls;
      });
    });
    const change = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;
    return [{ name: 'All APIs (Aggregate)', current: currentVolume, previous: previousVolume, change }];
  }, [apis]);

  const computeVolumes = (relevantAPIs: APIData[]) => {
    let currentVolume = 0;
    let previousVolume = 0;
    relevantAPIs.forEach(api => {
      api.dailyData.forEach(d => {
        currentVolume += d.calls;
        previousVolume += d.previousCalls;
      });
    });
    return { currentVolume, previousVolume };
  };

  // Build comparison chart data
  const chartData = useMemo(() => {
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
  }, [mode, selectedClients, selectedAPIs, apis]);

  const displayData = chartData.length > 0 ? chartData : aggregateData;
  const isShowingAggregate = chartData.length === 0;

  const items = mode === 'clients' ? clients : apiNames;
  const selected = mode === 'clients' ? selectedClients : selectedAPIs;
  const toggle = mode === 'clients' ? toggleClient : toggleAPI;

  // Detail view: status breakdown for the clicked item
  const detailBreakdown = useMemo(() => {
    if (!detailItem) return null;
    let relevantAPIs: APIData[];
    if (mode === 'clients') {
      relevantAPIs = apis.filter(a => a.client === detailItem.name);
    } else {
      relevantAPIs = apis.filter(a => a.name === detailItem.name);
    }

    // Aggregate status breakdown for current AND previous
    const breakdown = { success: 0, sourceDown: 0, notFound: 0, otherError: 0 };
    const prevBreakdown = { success: 0, sourceDown: 0, notFound: 0, otherError: 0 };
    relevantAPIs.forEach(api => {
      breakdown.success += api.statusBreakdown.success;
      breakdown.sourceDown += api.statusBreakdown.sourceDown;
      breakdown.notFound += api.statusBreakdown.notFound;
      breakdown.otherError += api.statusBreakdown.otherError;

      // Generate previous period breakdown (offset)
      const factor = 0.75 + (api.id.charCodeAt(0) % 10) / 40;
      prevBreakdown.success += Math.round(api.statusBreakdown.success * factor);
      prevBreakdown.sourceDown += Math.round(api.statusBreakdown.sourceDown * factor * 1.2);
      prevBreakdown.notFound += Math.round(api.statusBreakdown.notFound * factor * 1.1);
      prevBreakdown.otherError += Math.round(api.statusBreakdown.otherError * factor * 1.15);
    });

    const total = breakdown.success + breakdown.sourceDown + breakdown.notFound + breakdown.otherError;
    const prevTotal = prevBreakdown.success + prevBreakdown.sourceDown + prevBreakdown.notFound + prevBreakdown.otherError;

    return { breakdown, prevBreakdown, total, prevTotal, apis: relevantAPIs };
  }, [detailItem, mode, apis]);

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const item = data.activePayload[0].payload as DetailItem;
      setDetailItem(item);
    }
  };

  // ---- Side Drawer for detail ----
  const renderDetailDrawer = () => {
    if (!detailItem || !detailBreakdown) return null;

    const { breakdown, prevBreakdown, total, prevTotal } = detailBreakdown;
    const categories = [
      { key: 'success' as const, label: 'Success', color: STATUS_COLORS.success },
      { key: 'sourceDown' as const, label: 'Source Down', color: STATUS_COLORS.sourceDown },
      { key: 'notFound' as const, label: 'Not Found', color: STATUS_COLORS.notFound },
      { key: 'otherError' as const, label: 'Other Errors', color: STATUS_COLORS.otherError },
    ];

    const currentItems = categories.map(cat => ({
      ...cat,
      value: breakdown[cat.key],
      percent: total > 0 ? ((breakdown[cat.key] / total) * 100).toFixed(1) : '0',
    }));

    const prevItems = categories.map(cat => ({
      ...cat,
      value: prevBreakdown[cat.key],
      percent: prevTotal > 0 ? ((prevBreakdown[cat.key] / prevTotal) * 100).toFixed(1) : '0',
    }));

    const successRate = total > 0 ? (breakdown.success / total * 100) : 0;
    const prevSuccessRate = prevTotal > 0 ? (prevBreakdown.success / prevTotal * 100) : 0;
    const failureRate = 100 - successRate;
    const prevFailureRate = 100 - prevSuccessRate;

    const content = (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold truncate">{detailItem.name}</h2>
            <p className="text-sm text-muted-foreground">Current vs Previous Comparison</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDetailItem(null)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Volume comparison */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Volume</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current</p>
                <p className="text-2xl font-bold text-primary">{formatNumber(detailItem.current)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Previous</p>
                <p className="text-2xl font-bold text-muted-foreground">{formatNumber(detailItem.previous)}</p>
              </div>
            </div>
            <div className={cn(
              'flex items-center justify-center gap-1.5 text-sm font-medium mt-2',
              detailItem.change >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {detailItem.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {detailItem.change >= 0 ? '+' : ''}{detailItem.change.toFixed(1)}% change
            </div>
          </div>

          {/* Success / Failure rates comparison */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Success Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-success">{successRate.toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground">prev: {prevSuccessRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Failure Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-destructive">{failureRate.toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground">prev: {prevFailureRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Period Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Current Period Breakdown</h3>
            <div className="h-3 rounded-full overflow-hidden flex mb-3">
              {currentItems.map(item => (
                <div key={item.key} style={{ width: `${item.percent}%`, backgroundColor: item.color }} className="h-full transition-all" />
              ))}
            </div>
            <div className="space-y-1.5">
              {currentItems.map(item => (
                <div key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="text-sm font-semibold">{formatNumber(item.value)}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Period Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Previous Period Breakdown</h3>
            <div className="h-3 rounded-full overflow-hidden flex mb-3 opacity-60">
              {prevItems.map(item => (
                <div key={item.key} style={{ width: `${item.percent}%`, backgroundColor: item.color }} className="h-full transition-all" />
              ))}
            </div>
            <div className="space-y-1.5">
              {prevItems.map(item => (
                <div key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 opacity-60" style={{ backgroundColor: item.color }} />
                  <span className="text-sm flex-1 text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{formatNumber(item.value)}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-side comparison bar chart */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories.map(cat => ({
                    name: cat.label,
                    current: breakdown[cat.key],
                    previous: prevBreakdown[cat.key],
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  barGap={2}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatNumber} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name === 'previous' ? 'Previous' : 'Current']}
                  />
                  <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="previous" name="Previous" fill="hsl(var(--muted-foreground)/0.35)" radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <div className="fixed inset-0 z-50 bg-background animate-fade-in">
          {content}
        </div>
      );
    }

    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDetailItem(null)} />
        <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] max-w-[90vw] bg-background border-l border-border shadow-2xl animate-slide-in-right">
          {content}
        </div>
      </>
    );
  };

  // ---- Main Comparison View ----
  return (
    <div className="space-y-5">
      {/* Top controls row */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start">
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

      {/* Selection dropdown + badges */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[220px] justify-between text-sm h-9">
              <span className="truncate">
                {selected.length === 0
                  ? `Select ${mode === 'clients' ? 'clients' : 'APIs'}…`
                  : `${selected.length} selected`}
              </span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${mode === 'clients' ? 'clients' : 'APIs'}…`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {items.map(item => (
                    <CommandItem
                      key={item}
                      value={item}
                      onSelect={() => toggle(item)}
                      className="cursor-pointer"
                    >
                      <Check className={cn('mr-2 h-3.5 w-3.5', selected.includes(item) ? 'opacity-100' : 'opacity-0')} />
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(item => (
              <Badge key={item} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs">
                {item}
                <button onClick={() => toggle(item)} className="ml-0.5 hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Chart + summary cards */}
      <div className="space-y-5">
        {isShowingAggregate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Showing aggregate usage across all APIs. Select specific {mode === 'clients' ? 'clients' : 'APIs'} above to compare.
          </div>
        )}

        {!isShowingAggregate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Click on any bar to see detailed success/failure breakdown.
          </div>
        )}

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {isShowingAggregate ? 'Aggregate Usage — Current vs Previous Month' : 'Usage Volume Comparison'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {datePreset === 'current-vs-previous' || isShowingAggregate
                    ? 'Current month till today (blue) vs same dates previous month (gray)'
                    : 'Selected date range volume'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                  Current
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-muted-foreground/40 inline-block" />
                  Previous
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  barGap={2}
                  barCategoryGap="20%"
                  onClick={!isShowingAggregate ? handleBarClick : undefined}
                  className={!isShowingAggregate ? 'cursor-pointer' : ''}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    angle={displayData.length > 5 ? -20 : 0}
                    textAnchor={displayData.length > 5 ? 'end' : 'middle'}
                    height={displayData.length > 5 ? 60 : 30}
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

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {displayData.map(item => {
            const isUp = item.change >= 0;
            return (
              <Card
                key={item.name}
                className={cn('glass-card transition-all', !isShowingAggregate && 'cursor-pointer hover:ring-1 hover:ring-primary/30')}
                onClick={!isShowingAggregate ? () => setDetailItem(item) : undefined}
              >
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
      {renderDetailDrawer()}
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ChevronsUpDown, Check, Download, Bell, TrendingUp, TrendingDown,
  Minus, Clock, Zap, Gauge, AlertTriangle, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { APIData } from '@/lib/mockData';

interface PercentileAnalysisTabProps {
  apis: APIData[];
}

type TimeRange = 'hour' | 'day' | 'week' | 'month';

const PRESET_PERCENTILES = [30, 50, 90];
const PERCENTILE_COLORS: Record<number, string> = {
  30: 'hsl(var(--chart-1))',
  50: 'hsl(var(--chart-2))',
  90: 'hsl(var(--chart-3))',
  95: 'hsl(var(--chart-4))',
  99: 'hsl(var(--chart-5))',
};

const getPercentileColor = (p: number) =>
  PERCENTILE_COLORS[p] || `hsl(${(p * 3.6) % 360}, 70%, 50%)`;

// Generate mock percentile data for an API over time
function generatePercentileData(api: APIData, timeRange: TimeRange, percentiles: number[]) {
  const baseLatency = (api.name.charCodeAt(0) + api.name.charCodeAt(1)) % 80 + 20;
  const points = timeRange === 'hour' ? 12 : timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
  const labels = Array.from({ length: points }, (_, i) => {
    if (timeRange === 'hour') return `${i * 5}m`;
    if (timeRange === 'day') return `${i}:00`;
    if (timeRange === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
    return `Day ${i + 1}`;
  });

  return labels.map((label, i) => {
    const jitter = Math.sin(i * 0.7 + baseLatency) * 15;
    const spike = i === Math.floor(points * 0.6) ? 40 : 0;
    const entry: Record<string, string | number> = { time: label };

    percentiles.forEach(p => {
      const multiplier = p <= 30 ? 0.6 : p <= 50 ? 1 : p <= 90 ? 2.2 : p <= 95 ? 3 : 4;
      entry[`p${p}`] = Math.max(5, Math.round(baseLatency * multiplier + jitter + spike * (p / 50)));
    });

    entry.avg = Math.round(baseLatency * 1.1 + jitter);
    entry.min = Math.max(3, Math.round(baseLatency * 0.3 + jitter * 0.3));
    entry.max = Math.round(baseLatency * 4.5 + Math.abs(jitter) * 2 + spike * 2);

    return entry;
  });
}

function getAggregatedPercentileData(apis: APIData[], timeRange: TimeRange, percentiles: number[]) {
  if (apis.length === 0) return [];
  if (apis.length === 1) return generatePercentileData(apis[0], timeRange, percentiles);

  const allData = apis.map(a => generatePercentileData(a, timeRange, percentiles));
  return allData[0].map((_, i) => {
    const entry: Record<string, string | number> = { time: allData[0][i].time };
    percentiles.forEach(p => {
      const key = `p${p}`;
      entry[key] = Math.round(allData.reduce((s, d) => s + (d[i][key] as number), 0) / allData.length);
    });
    entry.avg = Math.round(allData.reduce((s, d) => s + (d[i].avg as number), 0) / allData.length);
    entry.min = Math.min(...allData.map(d => d[i].min as number));
    entry.max = Math.max(...allData.map(d => d[i].max as number));
    return entry;
  });
}

export const PercentileAnalysisTab = ({ apis }: PercentileAnalysisTabProps) => {
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [apiDropdownOpen, setApiDropdownOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const uniqueClients = useMemo(() => [...new Set(apis.map(a => a.client))].sort(), [apis]);

  const toggleClient = useCallback((client: string) => {
    setSelectedClients(prev => {
      const next = prev.includes(client) ? prev.filter(c => c !== client) : [...prev, client];
      // Auto-select/deselect APIs for this client
      const clientApiIds = apis.filter(a => a.client === client).map(a => a.id);
      if (next.includes(client)) {
        setSelectedAPIs(prevApis => [...new Set([...prevApis, ...clientApiIds])]);
      } else {
        setSelectedAPIs(prevApis => prevApis.filter(id => !clientApiIds.includes(id)));
      }
      return next;
    });
  }, [apis]);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [activePercentiles, setActivePercentiles] = useState<number[]>([...PRESET_PERCENTILES]);
  const [customPercentile, setCustomPercentile] = useState('');
  const [showAvg, setShowAvg] = useState(true);
  const [showMinMax, setShowMinMax] = useState(false);
  const [slaThreshold, setSlaThreshold] = useState<number | null>(null);
  const [slaInput, setSlaInput] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertPercentile, setAlertPercentile] = useState('90');
  const [alertLimit, setAlertLimit] = useState('200');

  const chosenAPIs = useMemo(() =>
    selectedAPIs.length > 0 ? apis.filter(a => selectedAPIs.includes(a.id)) : apis.slice(0, 3),
    [apis, selectedAPIs]
  );

  const data = useMemo(() =>
    getAggregatedPercentileData(chosenAPIs, timeRange, activePercentiles),
    [chosenAPIs, timeRange, activePercentiles]
  );

  const summaryStats = useMemo(() => {
    if (!data.length) return null;
    const stats: Record<string, { current: number; avg: number; min: number; max: number }> = {};
    activePercentiles.forEach(p => {
      const key = `p${p}`;
      const values = data.map(d => d[key] as number);
      stats[key] = {
        current: values[values.length - 1],
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
    return stats;
  }, [data, activePercentiles]);

  const toggleAPI = useCallback((id: string) => {
    setSelectedAPIs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const addCustomPercentile = () => {
    const val = parseInt(customPercentile);
    if (val >= 1 && val <= 99 && !activePercentiles.includes(val)) {
      setActivePercentiles(prev => [...prev, val].sort((a, b) => a - b));
      setCustomPercentile('');
    }
  };

  const removePercentile = (p: number) => {
    setActivePercentiles(prev => prev.filter(x => x !== p));
  };

  const setSLA = () => {
    const val = parseInt(slaInput);
    if (val > 0) { setSlaThreshold(val); setSlaInput(''); }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const exportData = data.map(row => ({
      time: row.time,
      ...Object.fromEntries(activePercentiles.map(p => [`P${p}_ms`, row[`p${p}`]])),
      avg_ms: row.avg,
      min_ms: row.min,
      max_ms: row.max,
    }));

    let content: string, mime: string, ext: string;
    if (format === 'csv') {
      const headers = Object.keys(exportData[0]);
      content = [headers.join(','), ...exportData.map(r => headers.map(h => r[h as keyof typeof r]).join(','))].join('\n');
      mime = 'text/csv'; ext = 'csv';
    } else {
      content = JSON.stringify(exportData, null, 2);
      mime = 'application/json'; ext = 'json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `percentile-analysis.${ext}`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `Downloaded as ${ext.toUpperCase()}` });
  };

  const handleSetAlert = () => {
    toast({
      title: 'Alert configured',
      description: `Alert set: P${alertPercentile} > ${alertLimit}ms`,
    });
  };

  const getTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const recent = values.slice(-3);
    const earlier = values.slice(0, 3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    return ((avgRecent - avgEarlier) / avgEarlier) * 100;
  };

  return (
    <div className="space-y-6 p-1">
      {/* Filters Row */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Percentile Performance Analysis
          </CardTitle>
          <CardDescription>Analyze API response times across percentiles to understand typical, fast, and slow request behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* API Selection */}
            <div className="space-y-1.5 min-w-[220px]">
              <Label className="text-xs font-medium text-muted-foreground">APIs</Label>
              <Popover open={apiDropdownOpen} onOpenChange={setApiDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm h-9">
                    {selectedAPIs.length === 0
                      ? 'All APIs (top 3)'
                      : `${selectedAPIs.length} selected`}
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search APIs..." />
                    <CommandList>
                      <CommandEmpty>No API found.</CommandEmpty>
                      <CommandGroup>
                        {apis.map(api => (
                          <CommandItem key={api.id} onSelect={() => toggleAPI(api.id)}>
                            <Check className={cn('w-3.5 h-3.5 mr-2', selectedAPIs.includes(api.id) ? 'opacity-100' : 'opacity-0')} />
                            <span className="truncate">{api.name}</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">{api.client}</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Range */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Time Range</Label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Last Hour</SelectItem>
                  <SelectItem value="day">Last Day</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Percentile Toggles */}
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs font-medium text-muted-foreground">Percentiles</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {activePercentiles.map(p => (
                  <Badge
                    key={p}
                    className="cursor-pointer gap-1 text-xs"
                    style={{ backgroundColor: getPercentileColor(p), color: '#fff' }}
                  >
                    P{p}
                    <X className="w-3 h-3 hover:scale-125 transition-transform" onClick={(e) => { e.stopPropagation(); removePercentile(p); }} />
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    className="w-16 h-7 text-xs"
                    placeholder="P?"
                    value={customPercentile}
                    onChange={e => setCustomPercentile(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && addCustomPercentile()}
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={addCustomPercentile}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Toggles row */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Switch id="show-avg" checked={showAvg} onCheckedChange={setShowAvg} />
              <Label htmlFor="show-avg" className="text-xs">Average</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-minmax" checked={showMinMax} onCheckedChange={setShowMinMax} />
              <Label htmlFor="show-minmax" className="text-xs">Min/Max</Label>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5">
              <Input className="w-16 h-7 text-xs" placeholder="SLA ms" value={slaInput} onChange={e => setSlaInput(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && setSLA()} />
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={setSLA}>Set SLA</Button>
              {slaThreshold && (
                <Badge variant="secondary" className="text-xs gap-1">
                  SLA: {slaThreshold}ms
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSlaThreshold(null)} />
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metric Cards */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {activePercentiles.map(p => {
            const key = `p${p}`;
            const s = summaryStats[key];
            const values = data.map(d => d[key] as number);
            const trend = getTrend(values);
            const breachesSLA = slaThreshold && s.current > slaThreshold;

            return (
              <Card key={p} className={cn('transition-all', breachesSLA && 'border-destructive/50 bg-destructive/5')}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: getPercentileColor(p) }}>P{p}</span>
                    {breachesSLA && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                  <div className="text-xl font-bold tabular-nums">{s.current}<span className="text-xs text-muted-foreground ml-0.5">ms</span></div>
                  <div className="flex items-center gap-1 text-[10px]">
                    {trend > 2 ? <TrendingUp className="w-3 h-3 text-destructive" /> : trend < -2 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                    <span className={cn('tabular-nums', trend > 2 ? 'text-destructive' : trend < -2 ? 'text-emerald-500' : 'text-muted-foreground')}>
                      {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    avg {s.avg} · min {s.min} · max {s.max}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Chart */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Response Time Percentiles</CardTitle>
            <CardDescription className="text-xs">
              {chosenAPIs.map(a => a.name).join(', ')} — {timeRange === 'hour' ? 'Last Hour' : timeRange === 'day' ? 'Last 24 Hours' : timeRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
            </CardDescription>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleExport('csv')}>
              <Download className="w-3 h-3" /> CSV
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleExport('json')}>
              <Download className="w-3 h-3" /> JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'ms', position: 'insideTopLeft', offset: -5, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [`${value}ms`, name.toUpperCase()]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {activePercentiles.map(p => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={`p${p}`}
                    name={`P${p}`}
                    stroke={getPercentileColor(p)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                ))}
                {showAvg && (
                  <Line type="monotone" dataKey="avg" name="Avg" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                )}
                {showMinMax && (
                  <>
                    <Line type="monotone" dataKey="min" name="Min" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 4" dot={false} opacity={0.5} />
                    <Line type="monotone" dataKey="max" name="Max" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 4" dot={false} opacity={0.5} />
                  </>
                )}
                {slaThreshold && (
                  <ReferenceLine y={slaThreshold} stroke="hsl(var(--destructive))" strokeDasharray="8 4" strokeWidth={1.5} label={{ value: `SLA: ${slaThreshold}ms`, fill: 'hsl(var(--destructive))', fontSize: 11, position: 'insideTopRight' }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Alert Configuration
          </CardTitle>
          <CardDescription className="text-xs">Set alerts when a percentile crosses a defined threshold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Percentile</Label>
              <Select value={alertPercentile} onValueChange={setAlertPercentile}>
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activePercentiles.map(p => (
                    <SelectItem key={p} value={String(p)}>P{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Threshold (ms)</Label>
              <Input className="w-[100px] h-9 text-sm" value={alertLimit} onChange={e => setAlertLimit(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="alert-toggle" checked={alertEnabled} onCheckedChange={setAlertEnabled} />
              <Label htmlFor="alert-toggle" className="text-xs">Enable</Label>
            </div>
            <Button size="sm" className="h-9" disabled={!alertEnabled} onClick={handleSetAlert}>
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Save Alert
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

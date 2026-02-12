import { useState, useMemo } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { APIData } from '@/lib/mockData';
import { getClientUsageData } from '@/lib/mockData';

type CompareMode = 'clients' | 'apis';
type DatePreset = 'current-vs-previous' | 'custom';

const COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 55%)', 'hsl(0, 72%, 55%)', 'hsl(190, 80%, 45%)',
  'hsl(330, 70%, 55%)', 'hsl(60, 70%, 45%)',
];

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

  // Build comparison chart data
  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));

    if (mode === 'clients') {
      if (selectedClients.length === 0) return [];
      return selectedClients.map(client => {
        const clientAPIs = apis.filter(a => a.client === client);
        let currentVolume = 0;
        let previousVolume = 0;

        clientAPIs.forEach(api => {
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

        return { name: client, current: currentVolume, previous: previousVolume };
      });
    } else {
      if (selectedAPIs.length === 0) return [];
      return selectedAPIs.map(apiName => {
        const matchingAPIs = apis.filter(a => a.name === apiName);
        let currentVolume = 0;
        let previousVolume = 0;

        matchingAPIs.forEach(api => {
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

        return { name: apiName, current: currentVolume, previous: previousVolume };
      });
    }
  }, [mode, selectedClients, selectedAPIs, apis, datePreset, customFrom, customTo]);

  const items = mode === 'clients' ? clients : apiNames;
  const selected = mode === 'clients' ? selectedClients : selectedAPIs;
  const toggle = mode === 'clients' ? toggleClient : toggleAPI;

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compare By</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              {(['clients', 'apis'] as CompareMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setSelectedClients([]); setSelectedAPIs([]); }}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'clients' ? 'Clients' : 'APIs'}
                </button>
              ))}
            </div>
          </div>

          {/* Date filter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setDatePreset('current-vs-previous')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    datePreset === 'current-vs-previous' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Current vs Previous Month
                </button>
                <button
                  onClick={() => setDatePreset('custom')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
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
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {customFrom ? format(customFrom, 'MMM d, yyyy') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {customTo ? format(customTo, 'MMM d, yyyy') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* Multi-select items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Select {mode === 'clients' ? 'Clients' : 'APIs'} to Compare
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {items.map(item => (
                <Badge
                  key={item}
                  variant={selected.includes(item) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-all text-xs',
                    selected.includes(item) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                  onClick={() => toggle(item)}
                >
                  {item}
                  {selected.includes(item) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Usage Volume Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                    formatter={(value: number) => [value.toLocaleString(), '']}
                  />
                  <Legend />
                  {datePreset === 'current-vs-previous' ? (
                    <>
                      <Bar dataKey="previous" name="Previous Month" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="current" name="Current Month" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="current" name="Volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Select {mode === 'clients' ? 'clients' : 'APIs'} above to compare their usage volumes.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

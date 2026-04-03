import { useState, useMemo } from 'react';
import { X, Search, Users, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Treemap,
} from 'recharts';
import type { APIData } from '@/lib/mockData';

interface BirdsEyeViewProps {
  apis: APIData[];
  onClose: () => void;
}

interface ClientSummary {
  client: string;
  totalHits: number;
  successCount: number;
  sourceDown: number;
  notFound: number;
  otherError: number;
  successRate: number;
  failures: number;
  apiCount: number;
  apis: string[];
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const COLORS = [
  'hsl(217, 91%, 50%)', 'hsl(142, 71%, 35%)', 'hsl(38, 92%, 45%)',
  'hsl(0, 72%, 51%)', 'hsl(262, 83%, 58%)', 'hsl(199, 89%, 48%)',
  'hsl(320, 70%, 50%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 50%)',
];

export function BirdsEyeView({ apis, onClose }: BirdsEyeViewProps) {
  const [search, setSearch] = useState('');

  const clientSummaries = useMemo(() => {
    const map = new Map<string, ClientSummary>();
    apis.forEach(api => {
      const existing = map.get(api.client);
      const sb = api.statusBreakdown;
      const total = sb.success + sb.sourceDown + sb.notFound + sb.otherError;
      if (existing) {
        existing.totalHits += total;
        existing.successCount += sb.success;
        existing.sourceDown += sb.sourceDown;
        existing.notFound += sb.notFound;
        existing.otherError += sb.otherError;
        existing.apiCount += 1;
        existing.apis.push(api.name);
      } else {
        map.set(api.client, {
          client: api.client, totalHits: total, successCount: sb.success,
          sourceDown: sb.sourceDown, notFound: sb.notFound, otherError: sb.otherError,
          successRate: 0, failures: 0, apiCount: 1, apis: [api.name],
        });
      }
    });
    map.forEach(c => {
      c.failures = c.sourceDown + c.notFound + c.otherError;
      c.successRate = c.totalHits > 0 ? (c.successCount / c.totalHits) * 100 : 0;
    });
    return Array.from(map.values()).sort((a, b) => b.totalHits - a.totalHits);
  }, [apis]);

  const filtered = useMemo(() => {
    if (!search) return clientSummaries;
    const q = search.toLowerCase();
    return clientSummaries.filter(c => c.client.toLowerCase().includes(q) || c.apis.some(a => a.toLowerCase().includes(q)));
  }, [clientSummaries, search]);

  const totals = useMemo(() => {
    const t = { clients: clientSummaries.length, hits: 0, success: 0, failures: 0 };
    clientSummaries.forEach(c => { t.hits += c.totalHits; t.success += c.successCount; t.failures += c.failures; });
    return { ...t, avgSuccessRate: t.hits > 0 ? (t.success / t.hits) * 100 : 0 };
  }, [clientSummaries]);

  // Chart data
  const barData = filtered.slice(0, 12).map(c => ({
    name: c.client.length > 10 ? c.client.slice(0, 10) + '…' : c.client,
    fullName: c.client,
    Success: c.successCount,
    'Source Down': c.sourceDown,
    '404': c.notFound,
    'Other Error': c.otherError,
  }));

  const pieData = [
    { name: 'Success', value: totals.success },
    { name: 'Source Down', value: clientSummaries.reduce((s, c) => s + c.sourceDown, 0) },
    { name: '404', value: clientSummaries.reduce((s, c) => s + c.notFound, 0) },
    { name: 'Other Error', value: clientSummaries.reduce((s, c) => s + c.otherError, 0) },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['hsl(142, 71%, 35%)', 'hsl(0, 72%, 51%)', 'hsl(38, 92%, 45%)', 'hsl(215, 16%, 47%)'];

  const treemapData = filtered.slice(0, 20).map((c, i) => ({
    name: c.client,
    size: c.totalHits,
    color: COLORS[i % COLORS.length],
  }));

  const getRateColor = (rate: number) => {
    if (rate >= 98) return 'text-success';
    if (rate >= 95) return 'text-warning';
    return 'text-destructive';
  };

  const getRateBarColor = (rate: number) => {
    if (rate >= 98) return 'bg-success';
    if (rate >= 95) return 'bg-warning';
    return 'bg-destructive';
  };

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, color } = props;
    if (width < 40 || height < 25) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} rx={4} fill={color} fillOpacity={0.85} stroke="hsl(var(--background))" strokeWidth={2} />
        {width > 60 && height > 30 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={width > 100 ? 11 : 9} fontWeight={600}>
            {name.length > width / 8 ? name.slice(0, Math.floor(width / 8)) + '…' : name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Bird's Eye View</h1>
          <Badge variant="outline" className="text-[10px]">Platform Snapshot</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Users className="w-3.5 h-3.5" /> Total Clients
              </div>
              <p className="text-3xl font-bold">{totals.clients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Activity className="w-3.5 h-3.5" /> Total Hits
              </div>
              <p className="text-3xl font-bold">{fmt(totals.hits)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-success" /> Avg Success Rate
              </div>
              <p className={cn('text-3xl font-bold', getRateColor(totals.avgSuccessRate))}>
                {totals.avgSuccessRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Total Failures
              </div>
              <p className="text-3xl font-bold text-destructive">{fmt(totals.failures)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients or APIs…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        {/* Charts Row 1: Stacked Bar + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Client-wise Hit Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={fmt} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      formatter={(value: number) => fmt(value)}
                      labelFormatter={(_: any, payload: any[]) => payload?.[0]?.payload?.fullName || _}
                    />
                    <Bar dataKey="Success" stackId="a" fill="hsl(142, 71%, 35%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Source Down" stackId="a" fill="hsl(0, 72%, 51%)" />
                    <Bar dataKey="404" stackId="a" fill="hsl(38, 92%, 45%)" />
                    <Bar dataKey="Other Error" stackId="a" fill="hsl(215, 16%, 47%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Overall Status Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Treemap: Usage volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Client Usage Volume Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  stroke="hsl(var(--background))"
                  content={<CustomTreemapContent />}
                />
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Client health cards grid */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Client Health Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((c, i) => (
              <Card key={c.client} className="relative overflow-hidden">
                {/* Volume bar background */}
                <div
                  className="absolute inset-0 bg-primary/5"
                  style={{ width: `${(c.totalHits / (filtered[0]?.totalHits || 1)) * 100}%` }}
                />
                <CardContent className="pt-4 pb-3 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm truncate max-w-[60%]">{c.client}</span>
                    <Badge variant="secondary" className="text-[10px]">{c.apiCount} APIs</Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-0.5">Hits</div>
                      <div className="text-lg font-bold tabular-nums">{fmt(c.totalHits)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-0.5">Success</div>
                      <div className={cn('text-lg font-bold tabular-nums', getRateColor(c.successRate))}>
                        {c.successRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {/* Success rate bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                    <div className={cn('h-full rounded-full transition-all', getRateBarColor(c.successRate))} style={{ width: `${c.successRate}%` }} />
                  </div>
                  {/* Failure badges */}
                  {c.failures > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.sourceDown > 0 && <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive bg-destructive/5">Src↓ {fmt(c.sourceDown)}</Badge>}
                      {c.notFound > 0 && <Badge variant="outline" className="text-[9px] border-warning/30 text-warning bg-warning/5">404 {fmt(c.notFound)}</Badge>}
                      {c.otherError > 0 && <Badge variant="outline" className="text-[9px] border-muted-foreground/30 text-muted-foreground">Err {fmt(c.otherError)}</Badge>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

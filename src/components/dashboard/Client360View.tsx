import { useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Zap, AlertTriangle, CheckCircle2, Ticket } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientUsageData, APIData } from '@/lib/mockData';
import { mockTickets } from '@/lib/mockTickets';
import { cn } from '@/lib/utils';

interface Props {
  clientData: ClientUsageData;
  clientAPIs: APIData[];
  allAPIs: APIData[];
  onBack: () => void;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))',
};

const PIE_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(160, 84%, 45%)',
  'hsl(43, 96%, 56%)',
  'hsl(280, 70%, 60%)',
  'hsl(340, 82%, 60%)',
];

export function Client360View({ clientData, clientAPIs, allAPIs, onBack }: Props) {
  const formatCalls = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  // Used vs unused APIs (from the catalog of all APIs available — unique API names)
  const apiCatalog = useMemo(() => [...new Set(allAPIs.map(a => a.name))], [allAPIs]);
  const usedNames = useMemo(() => new Set(clientAPIs.map(a => a.name)), [clientAPIs]);
  const usedCount = usedNames.size;
  const unusedCount = Math.max(apiCatalog.length - usedCount, 0);
  const adoptionPct = apiCatalog.length ? Math.round((usedCount / apiCatalog.length) * 100) : 0;

  const adoptionData = [
    { name: 'Adoption', value: adoptionPct, fill: COLORS.primary },
  ];

  const usedVsUnused = [
    { name: 'Used', value: usedCount },
    { name: 'Unused', value: unusedCount },
  ];

  // Volume by API (top 8)
  const volumeByAPI = useMemo(
    () =>
      [...clientAPIs]
        .sort((a, b) => b.currentCalls - a.currentCalls)
        .slice(0, 8)
        .map(a => ({ name: a.name, calls: a.currentCalls, prev: a.previousCalls })),
    [clientAPIs]
  );

  // Status mix across client APIs
  const statusMix = useMemo(() => {
    const acc = { healthy: 0, warning: 0, critical: 0 };
    clientAPIs.forEach(a => { acc[a.status]++; });
    return [
      { name: 'Healthy', value: acc.healthy, color: 'hsl(var(--success))' },
      { name: 'Warning', value: acc.warning, color: 'hsl(var(--warning))' },
      { name: 'Critical', value: acc.critical, color: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);
  }, [clientAPIs]);

  // Support history
  const tickets = useMemo(
    () => mockTickets.filter(t => t.client === clientData.client),
    [clientData.client]
  );
  const ticketStats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'OPEN').length;
    const inProg = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const closed = tickets.filter(t => t.status === 'CLOSED').length;
    return { open, inProg, closed, total: tickets.length };
  }, [tickets]);

  // Tickets over time (last 14 days, filled with dummy data when sparse)
  const ticketsOverTime = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach(t => map.set(t.date, (map.get(t.date) || 0) + 1));

    // Deterministic seed from client name for stable dummy data
    let seed = 0;
    for (let i = 0; i < clientData.client.length; i++) seed = (seed * 31 + clientData.client.charCodeAt(i)) >>> 0;
    const rand = (n: number) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % n;
    };

    const today = new Date('2026-03-17');
    const result: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const real = map.get(iso) || 0;
      // Add a stable dummy baseline (1-5) so chart is never empty
      const dummy = 1 + rand(5);
      result.push({ date: iso.slice(5), count: real + dummy });
    }
    return result;
  }, [tickets, clientData.client]);

  // Tickets by category
  const ticketsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach(t => map.set(t.category, (map.get(t.category) || 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // Resolved SLA stats
  const avgSLA = useMemo(() => {
    const closed = tickets.filter(t => t.status === 'CLOSED' && t.slaResolutionMinutes != null);
    if (!closed.length) return null;
    const avg = closed.reduce((s, t) => s + (t.slaResolutionMinutes || 0), 0) / closed.length;
    if (avg < 60) return `${Math.round(avg)}m`;
    const h = Math.floor(avg / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
  }, [tickets]);

  const trendColor =
    clientData.trend > 0 ? 'text-success' :
    clientData.trend < -10 ? 'text-destructive' : 'text-warning';

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{clientData.client}</h1>
            <Badge variant="secondary" className="ml-1">360° View</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Full trajectory · Usage, adoption & support — one screen, full story
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KPI icon={<Activity className="w-4 h-4" />} label="Total Calls" value={formatCalls(clientData.totalCalls)} />
        <KPI icon={<Zap className="w-4 h-4" />} label="APIs Used" value={`${usedCount}/${apiCatalog.length}`} sub={`${adoptionPct}% adoption`} />
        <KPI
          icon={clientData.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          label="Trend"
          value={`${clientData.trend > 0 ? '+' : ''}${clientData.trend.toFixed(1)}%`}
          valueClass={trendColor}
        />
        <KPI icon={<Ticket className="w-4 h-4" />} label="Support Tickets" value={ticketStats.total.toString()} sub={`${ticketStats.open} open`} />
        <KPI icon={<CheckCircle2 className="w-4 h-4" />} label="Avg SLA (closed)" value={avgSLA ?? '—'} />
      </div>

      {/* Row 1: Usage trend (volume) + Adoption gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Usage Trend (Volume)</h3>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={clientData.dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="c360-calls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCalls} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Area type="monotone" dataKey="previousCalls" name="Previous" stroke={COLORS.muted} strokeDasharray="4 3" fill="transparent" />
                <Area type="monotone" dataKey="calls" name="Current" stroke={COLORS.primary} strokeWidth={2} fill="url(#c360-calls)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">API Adoption</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={adoptionData} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={10} fill={COLORS.primary} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-32 mb-12 pointer-events-none">
            <div className="text-3xl font-bold">{adoptionPct}%</div>
            <div className="text-xs text-muted-foreground">{usedCount} of {apiCatalog.length}</div>
          </div>
          <div className="flex items-center justify-around text-sm pt-2 border-t border-border">
            <div className="text-center">
              <div className="font-semibold text-success">{usedCount}</div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-muted-foreground">{unusedCount}</div>
              <div className="text-xs text-muted-foreground">Unused</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: API-wise volume + Status mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Top APIs by Volume</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={volumeByAPI} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" stroke={COLORS.muted} fontSize={11} tickFormatter={formatCalls} />
                <YAxis type="category" dataKey="name" stroke={COLORS.muted} fontSize={11} width={140} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v: number) => formatCalls(v)} />
                <Bar dataKey="prev" name="Previous" fill="hsl(var(--muted-foreground)/0.3)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="calls" name="Current" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">API Health Mix</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusMix.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Support history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Support Ticket Volume</h3>
            <div className="flex gap-3 text-xs">
              <Badge variant="secondary">Open {ticketStats.open}</Badge>
              <Badge variant="default">In Progress {ticketStats.inProg}</Badge>
              <Badge variant="outline">Closed {ticketStats.closed}</Badge>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={ticketsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" name="Tickets" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Tickets by Category</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={ticketsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.value}>
                  {ticketsByCategory.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Used vs Unused APIs — bifurcation for sales push clarity */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold">API Bifurcation — Used vs Unused</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clear picture of what's adopted and what to push next
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-success/50 text-success">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Used {usedCount}
            </Badge>
            <Badge variant="outline" className="border-warning/50 text-warning">
              <AlertTriangle className="w-3 h-3 mr-1" /> Push {unusedCount}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* USED side */}
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="font-semibold text-sm">Currently Used</span>
              </div>
              <Badge variant="secondary">{usedCount}</Badge>
            </div>
            {usedCount === 0 ? (
              <p className="text-sm text-muted-foreground">No APIs adopted yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {[...clientAPIs]
                  .sort((a, b) => b.currentCalls - a.currentCalls)
                  .map(api => (
                    <div
                      key={api.name}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-background/60 border border-border/50 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          api.status === 'healthy' && 'bg-success',
                          api.status === 'warning' && 'bg-warning',
                          api.status === 'critical' && 'bg-destructive'
                        )} />
                        <span className="font-medium truncate">{api.name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {formatCalls(api.currentCalls)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* UNUSED / PUSH side */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="font-semibold text-sm">To Push — Cross-sell</span>
              </div>
              <Badge variant="secondary">{unusedCount}</Badge>
            </div>
            {unusedCount === 0 ? (
              <p className="text-sm text-muted-foreground">Client uses all available APIs. 🎉</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {apiCatalog
                  .filter(n => !usedNames.has(n))
                  .map(name => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-background/60 border border-border/50 text-xs"
                    >
                      <span className="font-medium truncate">{name}</span>
                      <Badge variant="outline" className="text-[10px] border-warning/40 text-warning shrink-0">
                        Opportunity
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, sub, valueClass }: { icon: React.ReactNode; label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
        {icon}{label}
      </div>
      <div className={cn('text-2xl font-semibold', valueClass)}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

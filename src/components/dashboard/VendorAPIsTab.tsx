import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { APIData } from '@/lib/mockData';

const VENDOR_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 55%)', 'hsl(0, 72%, 55%)', 'hsl(190, 80%, 45%)',
  'hsl(330, 70%, 55%)', 'hsl(60, 70%, 45%)',
];

// Assign vendors to APIs deterministically
const VENDORS = ['Twilio', 'Stripe', 'AWS', 'SendGrid', 'Google Cloud', 'Cloudflare', 'Datadog', 'Okta'];

function getVendorForAPI(api: APIData, index: number): string {
  return api.vendor || VENDORS[index % VENDORS.length];
}

interface VendorAPIsTabProps {
  apis: APIData[];
}

type DetailView = { type: 'none' } | { type: 'vendor'; vendor: string } | { type: 'api'; apiId: string; vendor: string };

export function VendorAPIsTab({ apis }: VendorAPIsTabProps) {
  const [detail, setDetail] = useState<DetailView>({ type: 'none' });

  // Only use ~40% of APIs as vendor APIs for realism
  const vendorAPIs = useMemo(() => {
    return apis
      .filter((_, i) => i % 3 === 0 || apis[_?.id ? 0 : 0].isVendorAPI)
      .map((api, i) => ({ ...api, vendor: getVendorForAPI(api, i) }));
  }, [apis]);

  const vendorGroups = useMemo(() => {
    const groups = new Map<string, typeof vendorAPIs>();
    vendorAPIs.forEach(api => {
      const existing = groups.get(api.vendor!) || [];
      existing.push(api);
      groups.set(api.vendor!, existing);
    });
    return Array.from(groups.entries())
      .map(([vendor, vendorApis]) => ({
        vendor,
        apis: vendorApis,
        totalVolume: vendorApis.reduce((s, a) => s + a.currentCalls, 0),
        apiCount: vendorApis.length,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [vendorAPIs]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Vendor detail view
  if (detail.type === 'vendor') {
    const group = vendorGroups.find(g => g.vendor === detail.vendor);
    if (!group) return null;

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setDetail({ type: 'none' })} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {group.vendor}
              <Badge variant="outline" className="text-xs">{group.apiCount} APIs</Badge>
              <Badge variant="secondary" className="text-xs">{formatNumber(group.totalVolume)} total calls</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={group.apis.map(a => ({ name: a.name, volume: a.currentCalls }))} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => formatNumber(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [v.toLocaleString(), 'Volume']} />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* API list with clickable detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {group.apis.map(api => {
            const successRate = api.statusBreakdown.success / (api.statusBreakdown.success + api.statusBreakdown.sourceDown + api.statusBreakdown.notFound + api.statusBreakdown.otherError) * 100;
            return (
              <Card key={api.id} className="glass-card cursor-pointer hover:border-primary/30 transition-all" onClick={() => setDetail({ type: 'api', apiId: api.id, vendor: detail.vendor })}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{api.name}</p>
                      <p className="text-xs text-muted-foreground">{api.client}</p>
                    </div>
                    <Badge variant={api.status === 'healthy' ? 'default' : api.status === 'warning' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {api.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatNumber(api.currentCalls)} calls</span>
                    <span>{successRate.toFixed(1)}% success</span>
                    <span className={cn('flex items-center gap-0.5', api.trend >= 0 ? 'text-success' : 'text-destructive')}>
                      {api.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(api.trend).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // API detail view
  if (detail.type === 'api') {
    const api = vendorAPIs.find(a => a.id === detail.apiId);
    if (!api) return null;

    const total = api.statusBreakdown.success + api.statusBreakdown.sourceDown + api.statusBreakdown.notFound + api.statusBreakdown.otherError;
    const successRate = (api.statusBreakdown.success / total * 100).toFixed(1);
    const clientsUsing = [...new Set(apis.filter(a => a.name === api.name).map(a => a.client))];

    const pieData = [
      { name: 'Success', value: api.statusBreakdown.success, color: 'hsl(142, 71%, 45%)' },
      { name: 'Source Down', value: api.statusBreakdown.sourceDown, color: 'hsl(38, 92%, 50%)' },
      { name: 'Not Found', value: api.statusBreakdown.notFound, color: 'hsl(280, 65%, 55%)' },
      { name: 'Other Error', value: api.statusBreakdown.otherError, color: 'hsl(0, 72%, 55%)' },
    ];

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setDetail({ type: 'vendor', vendor: detail.vendor })} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to {detail.vendor}
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">{api.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Vendor: {api.vendor} · Client: {api.client}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatNumber(api.currentCalls)}</p>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className={cn('text-2xl font-bold', api.trend >= 0 ? 'text-success' : 'text-destructive')}>
                  {api.trend >= 0 ? '+' : ''}{api.trend.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Trend</p>
              </div>
            </div>

            {/* Status breakdown pie */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Clients using this API */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clients Using This API</p>
              <div className="flex flex-wrap gap-1.5">
                {clientsUsing.map(client => (
                  <Badge key={client} variant="outline" className="text-xs">{client}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overview: Vendor grouped bar chart + vendor cards
  const vendorChartData = vendorGroups.map(g => ({ name: g.vendor, volume: g.totalVolume, apis: g.apiCount }));

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vendor API Volume by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => formatNumber(v)} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [v.toLocaleString(), 'Volume']} />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {vendorChartData.map((_, i) => (
                    <Cell key={i} fill={VENDOR_COLORS[i % VENDOR_COLORS.length]} cursor="pointer" onClick={() => setDetail({ type: 'vendor', vendor: vendorChartData[i].name })} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vendor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {vendorGroups.map((group, i) => (
          <Card
            key={group.vendor}
            className="glass-card cursor-pointer hover:border-primary/30 transition-all"
            onClick={() => setDetail({ type: 'vendor', vendor: group.vendor })}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VENDOR_COLORS[i % VENDOR_COLORS.length] }} />
                <p className="font-medium text-sm">{group.vendor}</p>
              </div>
              <p className="text-xl font-bold">{formatNumber(group.totalVolume)}</p>
              <p className="text-xs text-muted-foreground">{group.apiCount} APIs</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { X, Search, Users, Activity, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ClientAPIDateTable } from '@/components/dashboard/ClientAPIDateTable';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
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
  clientApis: APIData[];
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

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

export function BirdsEyeView({ apis, onClose }: BirdsEyeViewProps) {
  const [search, setSearch] = useState('');
  const [openClients, setOpenClients] = useState<Set<string>>(new Set());

  const toggleClient = (client: string) => {
    setOpenClients(prev => {
      const next = new Set(prev);
      if (next.has(client)) next.delete(client);
      else next.add(client);
      return next;
    });
  };

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
        existing.clientApis.push(api);
      } else {
        map.set(api.client, {
          client: api.client, totalHits: total, successCount: sb.success,
          sourceDown: sb.sourceDown, notFound: sb.notFound, otherError: sb.otherError,
          successRate: 0, failures: 0, apiCount: 1, clientApis: [api],
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
    return clientSummaries.filter(c =>
      c.client.toLowerCase().includes(q) ||
      c.clientApis.some(a => a.name.toLowerCase().includes(q))
    );
  }, [clientSummaries, search]);

  const totals = useMemo(() => {
    const t = { clients: clientSummaries.length, hits: 0, success: 0, failures: 0 };
    clientSummaries.forEach(c => { t.hits += c.totalHits; t.success += c.successCount; t.failures += c.failures; });
    return { ...t, avgSuccessRate: t.hits > 0 ? (t.success / t.hits) * 100 : 0 };
  }, [clientSummaries]);

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

        {/* Client Accordion List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            All Clients ({filtered.length})
          </h2>
          {filtered.map(c => {
            const isOpen = openClients.has(c.client);
            return (
              <Collapsible key={c.client} open={isOpen} onOpenChange={() => toggleClient(c.client)}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        <span className="font-semibold text-sm truncate min-w-[140px]">{c.client}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{c.apiCount} APIs</Badge>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground">Hits</div>
                          <div className="text-sm font-bold tabular-nums">{fmt(c.totalHits)}</div>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className="text-[10px] text-muted-foreground">Success</div>
                          <div className={cn('text-sm font-bold tabular-nums', getRateColor(c.successRate))}>
                            {c.successRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="w-24 hidden md:block">
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', getRateBarColor(c.successRate))} style={{ width: `${c.successRate}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 hidden sm:flex">
                          {c.sourceDown > 0 && <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive bg-destructive/5">Src↓ {fmt(c.sourceDown)}</Badge>}
                          {c.notFound > 0 && <Badge variant="outline" className="text-[9px] border-warning/30 text-warning bg-warning/5">404 {fmt(c.notFound)}</Badge>}
                          {c.otherError > 0 && <Badge variant="outline" className="text-[9px] border-muted-foreground/30 text-muted-foreground">Err {fmt(c.otherError)}</Badge>}
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border px-4 pb-4">
                      <ClientAPIDateTable apis={c.clientApis} />
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}

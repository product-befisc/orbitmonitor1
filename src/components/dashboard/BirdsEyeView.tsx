import { useState, useMemo } from 'react';
import { X, Search, Users, Activity, AlertTriangle, CheckCircle, ChevronDown, Server } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ClientAPIDateTable } from '@/components/dashboard/ClientAPIDateTable';
import { APIClientDateTable } from '@/components/dashboard/APIClientDateTable';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type { APIData } from '@/lib/mockData';

interface BirdsEyeViewProps {
  apis: APIData[];
  onClose: () => void;
}

interface GroupSummary {
  key: string; // client name OR api name
  totalHits: number;
  successCount: number;
  sourceDown: number;
  notFound: number;
  otherError: number;
  successRate: number;
  failures: number;
  itemCount: number; // # APIs (for client group) or # clients (for api group)
  items: APIData[];
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

function buildGroupSummaries(apis: APIData[], groupBy: 'client' | 'api'): GroupSummary[] {
  const map = new Map<string, GroupSummary>();
  apis.forEach(api => {
    const key = groupBy === 'client' ? api.client : api.name;
    const sb = api.statusBreakdown;
    const total = sb.success + sb.sourceDown + sb.notFound + sb.otherError;
    const existing = map.get(key);
    if (existing) {
      existing.totalHits += total;
      existing.successCount += sb.success;
      existing.sourceDown += sb.sourceDown;
      existing.notFound += sb.notFound;
      existing.otherError += sb.otherError;
      existing.itemCount += 1;
      existing.items.push(api);
    } else {
      map.set(key, {
        key, totalHits: total, successCount: sb.success,
        sourceDown: sb.sourceDown, notFound: sb.notFound, otherError: sb.otherError,
        successRate: 0, failures: 0, itemCount: 1, items: [api],
      });
    }
  });
  map.forEach(g => {
    g.failures = g.sourceDown + g.notFound + g.otherError;
    g.successRate = g.totalHits > 0 ? (g.successCount / g.totalHits) * 100 : 0;
  });
  return Array.from(map.values()).sort((a, b) => b.totalHits - a.totalHits);
}

interface GroupListProps {
  groups: GroupSummary[];
  groupBy: 'client' | 'api';
  search: string;
  onSearchChange: (v: string) => void;
}

function GroupList({ groups, groupBy, search, onSearchChange }: GroupListProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups.filter(g =>
      g.key.toLowerCase().includes(q) ||
      g.items.some(a => (groupBy === 'client' ? a.name : a.client).toLowerCase().includes(q))
    );
  }, [groups, search, groupBy]);

  const itemLabel = groupBy === 'client' ? 'APIs' : 'Clients';
  const placeholder = groupBy === 'client' ? 'Search clients or APIs…' : 'Search APIs or clients…';
  const headerLabel = groupBy === 'client' ? 'All Clients' : 'All APIs';

  return (
    <>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={placeholder} value={search} onChange={e => onSearchChange(e.target.value)} className="pl-9 h-9" />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          {headerLabel} ({filtered.length})
        </h2>
        {filtered.map(g => {
          const isOpen = openKeys.has(g.key);
          return (
            <Collapsible key={g.key} open={isOpen} onOpenChange={() => toggle(g.key)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <span className="font-semibold text-sm truncate min-w-[140px]">{g.key}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{g.itemCount} {itemLabel}</Badge>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">Hits</div>
                        <div className="text-sm font-bold tabular-nums">{fmt(g.totalHits)}</div>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <div className="text-[10px] text-muted-foreground">Success</div>
                        <div className={cn('text-sm font-bold tabular-nums', getRateColor(g.successRate))}>
                          {g.successRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="w-24 hidden md:block">
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', getRateBarColor(g.successRate))} style={{ width: `${g.successRate}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 hidden sm:flex">
                        {g.sourceDown > 0 && <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive bg-destructive/5">Src↓ {fmt(g.sourceDown)}</Badge>}
                        {g.notFound > 0 && <Badge variant="outline" className="text-[9px] border-warning/30 text-warning bg-warning/5">404 {fmt(g.notFound)}</Badge>}
                        {g.otherError > 0 && <Badge variant="outline" className="text-[9px] border-muted-foreground/30 text-muted-foreground">Err {fmt(g.otherError)}</Badge>}
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border px-4 pb-4">
                    {groupBy === 'client'
                      ? <ClientAPIDateTable apis={g.items} />
                      : <APIClientDateTable apis={g.items} />}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </>
  );
}

export function BirdsEyeView({ apis, onClose }: BirdsEyeViewProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [apiSearch, setApiSearch] = useState('');

  const clientGroups = useMemo(() => buildGroupSummaries(apis, 'client'), [apis]);
  const apiGroups = useMemo(() => buildGroupSummaries(apis, 'api'), [apis]);

  const totals = useMemo(() => {
    const t = { clients: clientGroups.length, apis: apiGroups.length, hits: 0, success: 0, failures: 0 };
    clientGroups.forEach(c => { t.hits += c.totalHits; t.success += c.successCount; t.failures += c.failures; });
    return { ...t, avgSuccessRate: t.hits > 0 ? (t.success / t.hits) * 100 : 0 };
  }, [clientGroups, apiGroups]);

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

        {/* Tabs: Clients / APIs */}
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-3.5 h-3.5" /> Clients ({totals.clients})
            </TabsTrigger>
            <TabsTrigger value="apis" className="gap-2">
              <Server className="w-3.5 h-3.5" /> APIs ({totals.apis})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-0">
            <GroupList groups={clientGroups} groupBy="client" search={clientSearch} onSearchChange={setClientSearch} />
          </TabsContent>

          <TabsContent value="apis" className="mt-0">
            <GroupList groups={apiGroups} groupBy="api" search={apiSearch} onSearchChange={setApiSearch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

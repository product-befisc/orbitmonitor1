import { useState, useMemo } from 'react';
import { X, ArrowUpDown, TrendingUp, TrendingDown, Search, Users, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { APIData } from '@/lib/mockData';

interface BirdsEyeViewProps {
  apis: APIData[];
  onClose: () => void;
}

type SortKey = 'client' | 'totalHits' | 'successRate' | 'failures' | 'apiCount';
type SortDir = 'asc' | 'desc';

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

export function BirdsEyeView({ apis, onClose }: BirdsEyeViewProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalHits');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
          client: api.client,
          totalHits: total,
          successCount: sb.success,
          sourceDown: sb.sourceDown,
          notFound: sb.notFound,
          otherError: sb.otherError,
          successRate: 0,
          failures: 0,
          apiCount: 1,
          apis: [api.name],
        });
      }
    });
    map.forEach(c => {
      c.failures = c.sourceDown + c.notFound + c.otherError;
      c.successRate = c.totalHits > 0 ? (c.successCount / c.totalHits) * 100 : 0;
    });
    return Array.from(map.values());
  }, [apis]);

  const filtered = useMemo(() => {
    let list = clientSummaries;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.client.toLowerCase().includes(q) || c.apis.some(a => a.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      if (typeof av === 'string') return sortDir === 'asc' ? (av as string).localeCompare(bv as string) : (bv as string).localeCompare(av as string);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [clientSummaries, search, sortKey, sortDir]);

  const totals = useMemo(() => {
    const t = { clients: clientSummaries.length, hits: 0, success: 0, failures: 0 };
    clientSummaries.forEach(c => { t.hits += c.totalHits; t.success += c.successCount; t.failures += c.failures; });
    return { ...t, avgSuccessRate: t.hits > 0 ? (t.success / t.hits) * 100 : 0 };
  }, [clientSummaries]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={cn('w-3 h-3', sortKey === k ? 'text-primary' : 'text-muted-foreground/40')} />
    </button>
  );

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

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
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
          <Input
            placeholder="Search clients or APIs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Client table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Client-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><SortHeader label="Client" k="client" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="Total Hits" k="totalHits" /></TableHead>
                  <TableHead className="text-right w-[180px]"><SortHeader label="Success Rate" k="successRate" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="Failures" k="failures" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="APIs" k="apiCount" /></TableHead>
                  <TableHead>Failure Breakdown</TableHead>
                  <TableHead>APIs Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.client}>
                    <TableCell className="font-medium">{c.client}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(c.totalHits)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', getRateBarColor(c.successRate))} style={{ width: `${c.successRate}%` }} />
                        </div>
                        <span className={cn('text-sm tabular-nums font-medium w-14 text-right', getRateColor(c.successRate))}>
                          {c.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn('tabular-nums', c.failures > 0 ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                        {fmt(c.failures)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.apiCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 text-[10px]">
                        {c.sourceDown > 0 && (
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5">
                            Src↓ {fmt(c.sourceDown)}
                          </Badge>
                        )}
                        {c.notFound > 0 && (
                          <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/5">
                            404 {fmt(c.notFound)}
                          </Badge>
                        )}
                        {c.otherError > 0 && (
                          <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                            Other {fmt(c.otherError)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.apis.slice(0, 3).map(a => (
                          <Badge key={a} variant="secondary" className="text-[10px] font-normal">{a}</Badge>
                        ))}
                        {c.apis.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] font-normal">+{c.apis.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

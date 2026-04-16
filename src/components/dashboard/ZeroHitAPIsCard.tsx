import { useState, useMemo } from 'react';
import { CircleDashed, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface ZeroHitAPI {
  client: string;
  apiName: string;
  onboardedDate: string;
  clientVolume: number; // total volume of the client across other APIs
}

const MOCK_ZERO_HIT_APIS: ZeroHitAPI[] = [
  { client: 'TechCorp', apiName: 'Address Verify v2', onboardedDate: '2026-01-15', clientVolume: 150 },
  { client: 'TechCorp', apiName: 'Credit Score Pro', onboardedDate: '2026-02-20', clientVolume: 150 },
  { client: 'FinServe', apiName: 'PAN Validate', onboardedDate: '2025-12-10', clientVolume: 520 },
  { client: 'DataSync', apiName: 'GST Lookup', onboardedDate: '2026-03-01', clientVolume: 3200 },
  { client: 'DataSync', apiName: 'Bank Statement Parse', onboardedDate: '2026-01-28', clientVolume: 3200 },
  { client: 'CloudNest', apiName: 'eSign API', onboardedDate: '2026-02-14', clientVolume: 75 },
  { client: 'RetailMax', apiName: 'Aadhaar OTP', onboardedDate: '2025-11-22', clientVolume: 4800 },
  { client: 'RetailMax', apiName: 'Digilocker Pull', onboardedDate: '2026-03-10', clientVolume: 4800 },
  { client: 'RetailMax', apiName: 'CKYC Search', onboardedDate: '2026-01-05', clientVolume: 4800 },
  { client: 'PayFlow', apiName: 'UPI Collect', onboardedDate: '2026-02-28', clientVolume: 350 },
];

type TimeRange = '1m' | '3m' | '6m' | 'all';
type VolumeRange = 'all' | '0-200' | '200-800' | '1000-5000' | 'custom';

const TIME_LABELS: Record<TimeRange, string> = {
  '1m': '1M',
  '3m': '3M',
  '6m': '6M',
  'all': 'All',
};

const VOLUME_OPTIONS: { value: VolumeRange; label: string }[] = [
  { value: 'all', label: 'All Volumes' },
  { value: '0-200', label: '0 – 200' },
  { value: '200-800', label: '200 – 800' },
  { value: '1000-5000', label: '1K – 5K' },
  { value: 'custom', label: 'Custom' },
];

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getMonthsAgo = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
};

const matchesVolume = (volume: number, range: VolumeRange, customMin: number, customMax: number) => {
  switch (range) {
    case 'all': return true;
    case '0-200': return volume <= 200;
    case '200-800': return volume > 200 && volume <= 800;
    case '1000-5000': return volume >= 1000 && volume <= 5000;
    case 'custom': return volume >= customMin && (customMax === 0 ? true : volume <= customMax);
  }
};

export function ZeroHitAPIsCard() {
  const [search, setSearch] = useState('');
  const [openClients, setOpenClients] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [volumeRange, setVolumeRange] = useState<VolumeRange>('all');
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');

  const filtered = useMemo(() => {
    const cMin = Number(customMin) || 0;
    const cMax = Number(customMax) || 0;
    return MOCK_ZERO_HIT_APIS.filter(a => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.client.toLowerCase().includes(q) && !a.apiName.toLowerCase().includes(q)) return false;
      }
      if (timeRange !== 'all') {
        const months = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : 6;
        const cutoff = getMonthsAgo(months);
        if (new Date(a.onboardedDate) < cutoff) return false;
      }
      if (!matchesVolume(a.clientVolume, volumeRange, cMin, cMax)) return false;
      return true;
    });
  }, [search, timeRange, volumeRange, customMin, customMax]);

  const grouped = useMemo(() => {
    const map = new Map<string, ZeroHitAPI[]>();
    filtered.forEach(api => {
      const list = map.get(api.client) || [];
      list.push(api);
      map.set(api.client, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const clientCount = grouped.length;

  const toggleClient = (client: string) => {
    setOpenClients(prev => {
      const next = new Set(prev);
      if (next.has(client)) next.delete(client);
      else next.add(client);
      return next;
    });
  };

  const formatVolume = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return String(v);
  };

  return (
    <Card className="border-warning/30 bg-warning/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDashed className="w-4 h-4 text-warning" />
            <span>APIs Onboarded – No Hits</span>
          </CardTitle>
          <Badge className="text-[11px] bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
            {filtered.length} APIs · {clientCount} clients
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          These APIs are onboarded for clients but have recorded zero usage — may need follow-up or activation support.
        </p>
        {/* Filters row */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <div className="relative w-36">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 pl-7 text-[11px] bg-muted/40 border-border/50"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-7 px-2 text-[11px] bg-muted/40 border-border/50 min-w-[120px] justify-between">
                {volumeRange === 'custom' && customMin
                  ? `${customMin} – ${customMax || '∞'}`
                  : VOLUME_OPTIONS.find(o => o.value === volumeRange)?.label ?? 'Volume'}
                <ChevronDown className="w-3 h-3 ml-1 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {VOLUME_OPTIONS.filter(o => o.value !== 'custom').map(opt => (
                  <Button
                    key={opt.value}
                    variant={volumeRange === opt.value ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-xs h-7"
                    onClick={() => { setVolumeRange(opt.value); setCustomMin(''); setCustomMax(''); }}
                  >
                    {opt.label}
                  </Button>
                ))}
                <div className="border-t border-border/50 pt-1 mt-1">
                  <p className="text-[10px] text-muted-foreground px-2 mb-1">Custom Range</p>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={customMin}
                      onChange={e => { setCustomMin(e.target.value); setVolumeRange('custom'); }}
                      className="h-6 text-[11px] px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground">–</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={customMax}
                      onChange={e => { setCustomMax(e.target.value); setVolumeRange('custom'); }}
                      className="h-6 text-[11px] px-1.5"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as TimeRange)}
            size="sm"
            className="bg-muted/50 rounded-md p-0.5"
          >
            {(Object.keys(TIME_LABELS) as TimeRange[]).map(key => (
              <ToggleGroupItem
                key={key}
                value={key}
                className="text-[11px] h-6 px-2 data-[state=on]:bg-warning data-[state=on]:text-warning-foreground rounded-sm"
              >
                {TIME_LABELS[key]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
          {grouped.map(([client, apis]) => {
            const vol = apis[0]?.clientVolume ?? 0;
            return (
              <Collapsible
                key={client}
                open={openClients.has(client)}
                onOpenChange={() => toggleClient(client)}
              >
                <CollapsibleTrigger className="w-full flex items-center justify-between rounded-md border border-warning/20 bg-warning/[0.06] px-3 py-2 hover:bg-warning/[0.1] transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    {openClients.has(client) ? (
                      <ChevronDown className="w-3.5 h-3.5 text-warning" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-warning" />
                    )}
                    <span className="text-sm font-medium text-foreground">{client}</span>
                    <span className="text-[10px] text-muted-foreground">({formatVolume(vol)} vol)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                    {apis.length} API{apis.length > 1 ? 's' : ''}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 mt-1 space-y-1">
                    {apis.map((api, i) => (
                      <div
                        key={`${api.apiName}-${i}`}
                        className="flex items-center justify-between rounded-md border border-border/30 bg-muted/30 px-3 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning/60 flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">{api.apiName}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">
                            0 hits
                          </Badge>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            Since {formatDate(api.onboardedDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          {grouped.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No results match your filters</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

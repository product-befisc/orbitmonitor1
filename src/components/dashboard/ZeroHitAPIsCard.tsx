import { useState, useMemo } from 'react';
import { CircleDashed, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface ZeroHitAPI {
  client: string;
  apiName: string;
  onboardedDate: string;
}

const MOCK_ZERO_HIT_APIS: ZeroHitAPI[] = [
  { client: 'TechCorp', apiName: 'Address Verify v2', onboardedDate: '2026-01-15' },
  { client: 'TechCorp', apiName: 'Credit Score Pro', onboardedDate: '2026-02-20' },
  { client: 'FinServe', apiName: 'PAN Validate', onboardedDate: '2025-12-10' },
  { client: 'DataSync', apiName: 'GST Lookup', onboardedDate: '2026-03-01' },
  { client: 'DataSync', apiName: 'Bank Statement Parse', onboardedDate: '2026-01-28' },
  { client: 'CloudNest', apiName: 'eSign API', onboardedDate: '2026-02-14' },
  { client: 'RetailMax', apiName: 'Aadhaar OTP', onboardedDate: '2025-11-22' },
  { client: 'RetailMax', apiName: 'Digilocker Pull', onboardedDate: '2026-03-10' },
  { client: 'RetailMax', apiName: 'CKYC Search', onboardedDate: '2026-01-05' },
  { client: 'PayFlow', apiName: 'UPI Collect', onboardedDate: '2026-02-28' },
];

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function ZeroHitAPIsCard() {
  const [search, setSearch] = useState('');
  const [openClients, setOpenClients] = useState<Set<string>>(new Set());

  const filtered = search
    ? MOCK_ZERO_HIT_APIS.filter(
        a =>
          a.client.toLowerCase().includes(search.toLowerCase()) ||
          a.apiName.toLowerCase().includes(search.toLowerCase())
      )
    : MOCK_ZERO_HIT_APIS;

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

  return (
    <Card className="border-warning/30 bg-warning/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDashed className="w-4 h-4 text-warning" />
            <span>APIs Onboarded – No Hits</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-36">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Filter…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-7 pl-7 text-[11px] bg-muted/40 border-border/50"
              />
            </div>
            <Badge className="text-[11px] bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
              {filtered.length} APIs · {clientCount} clients
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          These APIs are onboarded for clients but have recorded zero usage — may need follow-up or activation support.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
          {grouped.map(([client, apis]) => (
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
          ))}
          {grouped.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No results match "{search}"</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

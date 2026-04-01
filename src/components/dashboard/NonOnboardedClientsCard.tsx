import { useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';

const TIME_LABELS: Record<TimeRange, string> = {
  '1m': '1M',
  '3m': '3M',
  '6m': '6M',
  '1y': '1Y',
  'all': 'All',
};

// Mock data per time range
const CLIENTS_BY_RANGE: Record<TimeRange, { name: string; hits: number }[]> = {
  '1m': [
    { name: 'ByteWorks', hits: 34520 },
    { name: 'SaaS Hub', hits: 28190 },
    { name: 'FlowLogic', hits: 15740 },
    { name: 'SyncMaster', hits: 9830 },
    { name: 'NetPrime', hits: 7210 },
  ],
  '3m': [
    { name: 'ByteWorks', hits: 98400 },
    { name: 'SaaS Hub', hits: 81200 },
    { name: 'FlowLogic', hits: 47300 },
    { name: 'DataBridge', hits: 38100 },
    { name: 'SyncMaster', hits: 29500 },
    { name: 'NetPrime', hits: 21600 },
  ],
  '6m': [
    { name: 'ByteWorks', hits: 189000 },
    { name: 'SaaS Hub', hits: 164500 },
    { name: 'DataBridge', hits: 112000 },
    { name: 'FlowLogic', hits: 94200 },
    { name: 'SyncMaster', hits: 58700 },
    { name: 'NetPrime', hits: 43100 },
    { name: 'CloudNest', hits: 22400 },
  ],
  '1y': [
    { name: 'ByteWorks', hits: 412000 },
    { name: 'SaaS Hub', hits: 338000 },
    { name: 'DataBridge', hits: 245000 },
    { name: 'FlowLogic', hits: 198000 },
    { name: 'CloudNest', hits: 87600 },
    { name: 'SyncMaster', hits: 72300 },
    { name: 'NetPrime', hits: 54800 },
    { name: 'QuickAPI', hits: 31200 },
  ],
  all: [
    { name: 'ByteWorks', hits: 620000 },
    { name: 'SaaS Hub', hits: 510000 },
    { name: 'DataBridge', hits: 389000 },
    { name: 'FlowLogic', hits: 312000 },
    { name: 'CloudNest', hits: 145000 },
    { name: 'SyncMaster', hits: 118000 },
    { name: 'NetPrime', hits: 89400 },
    { name: 'QuickAPI', hits: 67200 },
    { name: 'TraceLink', hits: 41500 },
  ],
};

const formatHits = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export function NonOnboardedClientsCard() {
  const [range, setRange] = useState<TimeRange>('1m');
  const clients = CLIENTS_BY_RANGE[range];

  return (
    <Card className="border-destructive/30 bg-destructive/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span>Not Onboarded on Invoicing Portal</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => v && setRange(v as TimeRange)}
              size="sm"
              className="bg-muted/50 rounded-md p-0.5"
            >
              {(Object.keys(TIME_LABELS) as TimeRange[]).map((key) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  className="text-[11px] h-6 px-2 data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground rounded-sm"
                >
                  {TIME_LABELS[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Badge variant="destructive" className="text-[11px]">
              {clients.length} clients
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          These clients have active API hits but are not registered on the invoicing portal — potential revenue leakage.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
          {clients.map((client) => (
            <div
              key={client.name}
              className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/[0.04] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium text-destructive">{client.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatHits(client.hits)} hits
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-destructive/60" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
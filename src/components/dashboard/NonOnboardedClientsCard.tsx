import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Dummy list of clients that have API hits but are NOT onboarded on invoicing portal
const NON_ONBOARDED_CLIENTS = [
  { name: 'ByteWorks', hits: 34520 },
  { name: 'SaaS Hub', hits: 28190 },
  { name: 'FlowLogic', hits: 15740 },
  { name: 'SyncMaster', hits: 9830 },
  { name: 'NetPrime', hits: 7210 },
];

const formatHits = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

export function NonOnboardedClientsCard() {
  return (
    <Card className="border-destructive/30 bg-destructive/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span>Not Onboarded on Invoicing Portal</span>
          <Badge variant="destructive" className="ml-auto text-[11px]">
            {NON_ONBOARDED_CLIENTS.length} clients
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          These clients have active API hits but are not registered on the invoicing portal — potential revenue leakage.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {NON_ONBOARDED_CLIENTS.map((client) => (
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

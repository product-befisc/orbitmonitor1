import { ArrowLeft, AlertTriangle, Activity, TrendingUp, TrendingDown, ChevronRight, Shield, Flag, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';
import { getClientIPs, hasNonWhitelistedIP } from '@/lib/mockClientIPs';

interface AlertDetailViewProps {
  apis: APIData[];
  onBack: () => void;
  onSelectAPI: (apiId: string) => void;
}

export function AlertDetailView({ apis, onBack, onSelectAPI }: AlertDetailViewProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  const warningAPIs = apis.filter(a => a.status === 'warning');
  const criticalAPIs = apis.filter(a => a.status === 'critical');
  const allAlertAPIs = [...criticalAPIs, ...warningAPIs];

  const warningClients = new Set(warningAPIs.map(a => a.client)).size;
  const criticalClients = new Set(criticalAPIs.map(a => a.client)).size;
  const allClients = new Set(allAlertAPIs.map(a => a.client)).size;

  // Unique clients across all APIs to check IP whitelist status
  const uniqueClients = Array.from(new Set(apis.map(a => a.client)));
  const flaggedClients = uniqueClients.filter(c => hasNonWhitelistedIP(c)).sort();

  const renderAPIList = (filteredAPIs: APIData[], isWarning?: boolean) => {
    const clientGroups = new Map<string, APIData[]>();
    filteredAPIs.forEach(api => {
      const existing = clientGroups.get(api.client) || [];
      existing.push(api);
      clientGroups.set(api.client, existing);
    });

    const sortedClients = Array.from(clientGroups.entries())
      .sort((a, b) => b[1].length - a[1].length);

    if (filteredAPIs.length === 0) {
      return (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No alerts at this time.</p>
        </div>
      );
    }

    return sortedClients.map(([client, clientAPIs]) => (
      <div key={client} className="glass-card mb-4">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{client}</h3>
            <p className="text-xs text-muted-foreground">
              {clientAPIs.length} alert{clientAPIs.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-1.5">
            {clientAPIs.some(a => a.status === 'critical') && (
              <Badge variant="outline" className="border-destructive/50 text-destructive">
                {clientAPIs.filter(a => a.status === 'critical').length} critical
              </Badge>
            )}
            {clientAPIs.some(a => a.status === 'warning') && (
              <Badge variant="outline" className="border-warning/50 text-warning">
                {clientAPIs.filter(a => a.status === 'warning').length} warning
              </Badge>
            )}
          </div>
        </div>
        <div className="divide-y divide-border">
          {clientAPIs
            .sort((a, b) => b.currentCalls - a.currentCalls)
            .map(api => (
              <div
                key={api.id}
                onClick={() => onSelectAPI(api.id)}
                className="p-4 cursor-pointer hover:bg-muted/50 flex items-center gap-4 transition-colors"
              >
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full flex-shrink-0',
                  api.status === 'warning' ? 'bg-warning' : 'bg-destructive pulse-dot'
                )} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm block truncate">{api.name}</span>
                </div>
                <Badge variant="outline" className={cn(
                  'text-[10px] flex-shrink-0',
                  api.status === 'critical' ? 'border-destructive/50 text-destructive' : 'border-warning/50 text-warning'
                )}>
                  {api.status}
                </Badge>
                <div className="text-right flex-shrink-0">
                  <span className="font-medium">{formatCalls(api.currentCalls)}</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm font-medium flex-shrink-0',
                  api.trend < -10 ? 'text-destructive' : api.trend < 0 ? 'text-warning' : 'text-success'
                )}>
                  {api.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {api.trend > 0 ? '+' : ''}{api.trend}%
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-warning" />
          <div>
            <h1 className="text-2xl font-bold">All Alerts</h1>
            <p className="text-sm text-muted-foreground">
              {allAlertAPIs.length} APIs across {allClients} clients
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Total Alerts</p>
          <p className="text-3xl font-semibold">{allAlertAPIs.length}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <p className="text-sm text-muted-foreground">Critical</p>
          </div>
          <p className="text-3xl font-semibold text-destructive">{criticalAPIs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{criticalClients} clients</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <p className="text-sm text-muted-foreground">Warning</p>
          </div>
          <p className="text-3xl font-semibold text-warning">{warningAPIs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{warningClients} clients</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Calls Impacted</p>
          <p className="text-3xl font-semibold">
            {formatCalls(allAlertAPIs.reduce((s, a) => s + a.currentCalls, 0))}
          </p>
        </div>
      </div>

      {/* Tabs: All / Critical / Warning / IP Whitelist */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({allAlertAPIs.length})</TabsTrigger>
          <TabsTrigger value="critical" className="gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Critical ({criticalAPIs.length})
          </TabsTrigger>
          <TabsTrigger value="warning" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning ({warningAPIs.length})
          </TabsTrigger>
          <TabsTrigger value="ips" className="gap-1.5">
            <Flag className={cn('w-3.5 h-3.5', flaggedClients.length > 0 && 'text-destructive')} />
            IP Whitelist ({flaggedClients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderAPIList(allAlertAPIs)}
        </TabsContent>
        <TabsContent value="critical">
          {renderAPIList(criticalAPIs, false)}
        </TabsContent>
        <TabsContent value="warning">
          {renderAPIList(warningAPIs, true)}
        </TabsContent>
        <TabsContent value="ips">
          <IPWhitelistAlerts flaggedClients={flaggedClients} totalClients={uniqueClients.length} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IPWhitelistAlerts({ flaggedClients, totalClients }: { flaggedClients: string[]; totalClients: number }) {
  const [openClient, setOpenClient] = useState<string | null>(null);
  const pct = totalClients > 0 ? (flaggedClients.length / totalClients) * 100 : 0;

  if (flaggedClients.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Flag className="w-8 h-8 mx-auto mb-3 text-success" />
        <p className="text-muted-foreground">All clients have their IPs whitelisted.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Clients with non-whitelisted IPs</p>
          <p className="text-2xl font-semibold">
            {flaggedClients.length} <span className="text-base text-muted-foreground font-normal">of {totalClients}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Non-compliance</p>
          <p className={cn(
            'text-3xl font-semibold',
            pct >= 30 ? 'text-destructive' : pct >= 10 ? 'text-warning' : 'text-foreground'
          )}>
            {pct.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className="glass-card divide-y divide-border">
      {flaggedClients.map(client => {
        const ips = getClientIPs(client);
        const nonWhitelisted = ips.filter(i => !i.whitelisted);
        const isOpen = openClient === client;
        return (
          <Collapsible
            key={client}
            open={isOpen}
            onOpenChange={(o) => setOpenClient(o ? client : null)}
          >
            <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left">
              <Flag className="w-4 h-4 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{client}</p>
                <p className="text-xs text-muted-foreground">
                  {nonWhitelisted.length} of {ips.length} IP{ips.length > 1 ? 's' : ''} not whitelisted
                </p>
              </div>
              <Badge variant="destructive" className="gap-1">
                {nonWhitelisted.length} flagged
              </Badge>
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ips.map(entry => (
                    <TableRow key={entry.ip}>
                      <TableCell className="font-mono text-sm">{entry.ip}</TableCell>
                      <TableCell className="text-sm">{entry.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.addedOn}</TableCell>
                      <TableCell>
                        {entry.whitelisted ? (
                          <Badge variant="outline" className="border-success/50 text-success">
                            Whitelisted
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <Flag className="w-3 h-3" />
                            Not Whitelisted
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      </div>
    </div>
  );
}

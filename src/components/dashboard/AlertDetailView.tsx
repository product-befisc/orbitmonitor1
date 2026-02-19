import { ArrowLeft, AlertTriangle, Activity, TrendingUp, TrendingDown, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';

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

      {/* Tabs: All / Critical / Warning */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({allAlertAPIs.length})</TabsTrigger>
          <TabsTrigger value="critical" className="gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Critical ({criticalAPIs.length})
          </TabsTrigger>
          <TabsTrigger value="warning" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning ({warningAPIs.length})
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
      </Tabs>
    </div>
  );
}

import { ArrowLeft, AlertTriangle, Activity, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';

interface AlertDetailViewProps {
  alertType: 'warning' | 'critical';
  apis: APIData[];
  onBack: () => void;
  onSelectAPI: (apiId: string) => void;
}

export function AlertDetailView({ alertType, apis, onBack, onSelectAPI }: AlertDetailViewProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  const filteredAPIs = apis.filter(a => a.status === alertType);

  // Group by client
  const clientGroups = new Map<string, APIData[]>();
  filteredAPIs.forEach(api => {
    const existing = clientGroups.get(api.client) || [];
    existing.push(api);
    clientGroups.set(api.client, existing);
  });

  const sortedClients = Array.from(clientGroups.entries())
    .sort((a, b) => b[1].length - a[1].length);

  const isWarning = alertType === 'warning';
  const title = isWarning ? 'Warning Alerts' : 'Critical Alerts';
  const icon = isWarning
    ? <AlertTriangle className="w-6 h-6 text-warning" />
    : <Activity className="w-6 h-6 text-destructive" />;

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAPIs.length} APIs across {clientGroups.size} clients
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Affected APIs</p>
          <p className="text-3xl font-semibold">{filteredAPIs.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Affected Clients</p>
          <p className="text-3xl font-semibold">{clientGroups.size}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Total Calls Impacted</p>
          <p className="text-3xl font-semibold">
            {formatCalls(filteredAPIs.reduce((s, a) => s + a.currentCalls, 0))}
          </p>
        </div>
      </div>

      {/* Grouped by client */}
      {sortedClients.map(([client, clientAPIs]) => (
        <div key={client} className="glass-card mb-4">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{client}</h3>
              <p className="text-xs text-muted-foreground">
                {clientAPIs.length} {alertType} API{clientAPIs.length > 1 ? 's' : ''}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                isWarning
                  ? 'border-warning/50 text-warning'
                  : 'border-destructive/50 text-destructive'
              )}
            >
              {clientAPIs.length} alert{clientAPIs.length > 1 ? 's' : ''}
            </Badge>
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
                    isWarning ? 'bg-warning' : 'bg-destructive pulse-dot'
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm block truncate">{api.name}</span>
                  </div>
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
      ))}

      {filteredAPIs.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No {alertType} alerts at this time.</p>
        </div>
      )}
    </div>
  );
}

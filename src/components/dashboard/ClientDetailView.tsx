import { ArrowLeft, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UsageChart } from './UsageChart';
import { ClientUsageData, APIData } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface ClientDetailViewProps {
  clientData: ClientUsageData;
  clientAPIs: APIData[];
  onBack: () => void;
  onSelectAPI: (apiId: string) => void;
}

export function ClientDetailView({ clientData, clientAPIs, onBack, onSelectAPI }: ClientDetailViewProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  const sortedAPIs = [...clientAPIs].sort((a, b) => b.currentCalls - a.currentCalls);

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{clientData.client}</h1>
          <p className="text-sm text-muted-foreground">
            {clientData.apiCount} APIs • {formatCalls(clientData.totalCalls)} total calls
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
          <p className="text-3xl font-semibold">{formatCalls(clientData.totalCalls)}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">APIs Used</p>
          <p className="text-3xl font-semibold">{clientData.apiCount}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Trend</p>
          <div className={cn(
            'flex items-center gap-2 text-3xl font-semibold',
            clientData.trend > 0 ? 'text-success' : clientData.trend < -10 ? 'text-destructive' : 'text-warning'
          )}>
            {clientData.trend > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {clientData.trend > 0 ? '+' : ''}{clientData.trend.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <UsageChart
        dailyData={clientData.dailyData}
        weeklyData={clientData.weeklyData}
        monthlyData={clientData.monthlyData}
        title={`${clientData.client} Usage`}
      />

      {/* API List */}
      <div className="glass-card mt-6">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold">APIs Used by {clientData.client}</h3>
          <p className="text-sm text-muted-foreground">{sortedAPIs.length} endpoints</p>
        </div>
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {sortedAPIs.map(api => (
            <div
              key={api.id}
              onClick={() => onSelectAPI(api.id)}
              className="p-4 cursor-pointer hover:bg-muted/50 flex items-center gap-4 transition-colors"
            >
              <div className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0',
                api.status === 'healthy' && 'bg-success',
                api.status === 'warning' && 'bg-warning',
                api.status === 'critical' && 'bg-destructive pulse-dot'
              )} />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm block truncate">{api.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-medium">{formatCalls(api.currentCalls)}</span>
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium flex-shrink-0',
                api.trend > 0 ? 'text-success' : api.trend < -10 ? 'text-destructive' : api.trend < 0 ? 'text-warning' : 'text-muted-foreground'
              )}>
                {api.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {api.trend > 0 ? '+' : ''}{api.trend}%
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';

interface APIRankingListProps {
  apis: APIData[];
  onSelectAPI: (apiId: string) => void;
}

export function APIRankingList({ apis, onSelectAPI }: APIRankingListProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  return (
    <div className="glass-card animate-fade-in">
      <div className="p-5 border-b border-border">
        <h3 className="text-lg font-semibold">API Usage</h3>
        <p className="text-sm text-muted-foreground">{apis.length} endpoints ranked by volume</p>
      </div>

      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {apis.slice(0, 30).map((api) => (
          <div
            key={api.id}
            onClick={() => onSelectAPI(api.id)}
            className="p-4 cursor-pointer hover:bg-muted/50 flex items-center gap-3 transition-colors"
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
              <span className="font-medium text-sm">{formatCalls(api.currentCalls)}</span>
              <div className="text-[10px] text-muted-foreground">prev: {formatCalls(api.previousCalls)}</div>
            </div>

            <div className={cn(
              'flex items-center gap-1 text-xs font-medium flex-shrink-0',
              api.trend > 0 ? 'text-success' : api.trend < -10 ? 'text-destructive' : api.trend < 0 ? 'text-warning' : 'text-muted-foreground'
            )}>
              {api.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {api.trend > 0 ? '+' : ''}{api.trend}%
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </div>

      {apis.length > 30 && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t border-border">
          Showing 30 of {apis.length} APIs
        </div>
      )}
    </div>
  );
}

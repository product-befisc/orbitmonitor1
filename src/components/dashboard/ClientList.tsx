import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientUsageData } from '@/lib/mockData';

interface ClientListProps {
  clients: ClientUsageData[];
  onSelectClient: (clientName: string) => void;
}

export function ClientList({ clients, onSelectClient }: ClientListProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  return (
    <div className="glass-card animate-fade-in">
      <div className="p-5 border-b border-border">
        <h3 className="text-lg font-semibold">Client Usage</h3>
        <p className="text-sm text-muted-foreground">{clients.length} clients ranked by volume</p>
      </div>

      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {clients.map((client, index) => (
          <div
            key={client.client}
            onClick={() => onSelectClient(client.client)}
            className="p-4 cursor-pointer transition-colors hover:bg-muted/50 flex items-center gap-4"
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-medium truncate block">{client.client}</span>
              <span className="text-xs text-muted-foreground">{client.apiCount} APIs</span>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-semibold">{formatCalls(client.totalCalls)}</div>
              <div className={cn(
                'flex items-center justify-end gap-1 text-xs font-medium',
                client.trend > 0 ? 'text-success' : client.trend < -10 ? 'text-destructive' : client.trend < 0 ? 'text-warning' : 'text-muted-foreground'
              )}>
                {client.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {client.trend > 0 ? '+' : ''}{client.trend.toFixed(1)}%
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

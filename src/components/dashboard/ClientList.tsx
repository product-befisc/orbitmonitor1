import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Search, Users, AlertCircle, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientUsageData } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClientListProps {
  clients: ClientUsageData[];
  onSelectClient: (clientName: string) => void;
}

export function ClientList({ clients, onSelectClient }: ClientListProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? clients.filter(c => c.client.toLowerCase().includes(search.toLowerCase()))
    : clients;

  const maxCalls = clients[0]?.totalCalls ?? 1;

  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  return (
    <TooltipProvider>
      <div className="glass-card animate-fade-in flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Client Usage
            </h3>
            <p className="text-sm text-muted-foreground">{clients.length} clients ranked by volume</p>
          </div>
          <div className="relative w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/40 border-border/50"
            />
          </div>
        </div>

        <div className="divide-y divide-border/50 max-h-[520px] overflow-y-auto">
          {filtered.map((client, index) => {
            const originalIndex = clients.indexOf(client);
            const volumePercent = (client.totalCalls / maxCalls) * 100;

            return (
              <div
                key={client.client}
                onClick={() => onSelectClient(client.client)}
                className="relative p-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 flex items-center gap-4 group"
              >
                {/* Volume bar background */}
                <div
                  className="absolute inset-y-0 left-0 bg-primary/[0.04] transition-all duration-500 pointer-events-none"
                  style={{ width: `${volumePercent}%` }}
                />

                <div className={cn(
                  'relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-110',
                  originalIndex < 3 ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                )}>
                  {originalIndex + 1}
                </div>

                <div className="relative flex-1 min-w-0">
                  <span className="font-medium truncate block group-hover:text-primary transition-colors">{client.client}</span>
                  <span className="text-xs text-muted-foreground">{client.apiCount} APIs</span>
                </div>

                <div className="relative text-right flex-shrink-0">
                  <div className="font-semibold tabular-nums">{formatCalls(client.totalCalls)}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    prev: {formatCalls(client.previousTotalCalls)}
                  </div>
                </div>

                {/* Not Onboarded indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex-shrink-0">
                      {client.notOnboarded ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Not Invoiced
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground border-border/50">
                          Invoiced
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {client.notOnboarded
                      ? 'Client has production hits but is not onboarded on the invoicing portal'
                      : 'Client is onboarded on the invoicing portal'}
                  </TooltipContent>
                </Tooltip>

                {/* Zero Hit APIs indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex-shrink-0">
                      {client.zeroHitAPIs > 0 ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1 text-warning border-warning/30 bg-warning/10">
                          <CircleDashed className="w-3 h-3" />
                          {client.zeroHitAPIs} idle
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground border-border/50">
                          All active
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {client.zeroHitAPIs > 0
                      ? `${client.zeroHitAPIs} API(s) onboarded but have zero hits`
                      : 'All onboarded APIs have active usage'}
                  </TooltipContent>
                </Tooltip>

                <div className={cn(
                  'relative flex items-center gap-1 text-xs font-medium flex-shrink-0 min-w-[60px] justify-end',
                  client.trend > 0 ? 'text-success' : client.trend < -10 ? 'text-destructive' : client.trend < 0 ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {client.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="tabular-nums">{client.trend > 0 ? '+' : ''}{client.trend.toFixed(1)}%</span>
                </div>

                <ChevronRight className="relative w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No clients match "{search}"</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

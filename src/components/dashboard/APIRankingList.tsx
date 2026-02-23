import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Search, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';
import { Input } from '@/components/ui/input';

interface APIRankingListProps {
  apis: APIData[];
  onSelectAPI: (apiId: string) => void;
}

export function APIRankingList({ apis, onSelectAPI }: APIRankingListProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? apis.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : apis;

  const maxCalls = apis[0]?.currentCalls ?? 1;

  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  return (
    <div className="glass-card animate-fade-in flex flex-col">
      <div className="p-5 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            API Usage
          </h3>
          <p className="text-sm text-muted-foreground">{apis.length} endpoints ranked by volume</p>
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
        {filtered.slice(0, 30).map((api) => {
          const volumePercent = (api.currentCalls / maxCalls) * 100;

          return (
            <div
              key={api.id}
              onClick={() => onSelectAPI(api.id)}
              className="relative p-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 flex items-center gap-3 group"
            >
              {/* Volume bar background */}
              <div
                className="absolute inset-y-0 left-0 bg-primary/[0.04] transition-all duration-500 pointer-events-none"
                style={{ width: `${volumePercent}%` }}
              />

              <div className={cn(
                'relative w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125',
                api.status === 'healthy' && 'bg-success',
                api.status === 'warning' && 'bg-warning',
                api.status === 'critical' && 'bg-destructive pulse-dot'
              )} />

              <div className="relative flex-1 min-w-0">
                <span className="font-mono text-sm block truncate group-hover:text-primary transition-colors">{api.name}</span>
              </div>

              <div className="relative text-right flex-shrink-0">
                <span className="font-medium text-sm tabular-nums">{formatCalls(api.currentCalls)}</span>
                <div className="text-[11px] text-muted-foreground tabular-nums">prev: {formatCalls(api.previousCalls)}</div>
              </div>

              <div className={cn(
                'relative flex items-center gap-1 text-xs font-medium flex-shrink-0 min-w-[60px] justify-end',
                api.trend > 0 ? 'text-success' : api.trend < -10 ? 'text-destructive' : api.trend < 0 ? 'text-warning' : 'text-muted-foreground'
              )}>
                {api.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="tabular-nums">{api.trend > 0 ? '+' : ''}{api.trend}%</span>
              </div>

              <ChevronRight className="relative w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No APIs match "{search}"</div>
        )}
      </div>

      {apis.length > 30 && filtered.length > 30 && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t border-border">
          Showing 30 of {filtered.length} APIs
        </div>
      )}
    </div>
  );
}

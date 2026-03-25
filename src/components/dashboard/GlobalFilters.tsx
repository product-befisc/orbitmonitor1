import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface GlobalFilterState {
  client: string;
  api: string;
  status: string;
  salesPerson: string;
}

interface GlobalFiltersProps {
  filters: GlobalFilterState;
  onFiltersChange: (filters: GlobalFilterState) => void;
  clients: string[];
  apis: string[];
  salesPersons: string[];
}

export function GlobalFilters({ filters, onFiltersChange, clients, apis, salesPersons }: GlobalFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [filters.client, filters.api, filters.status, filters.salesPerson]
    .filter(v => v !== 'all').length;

  const handleReset = () => {
    onFiltersChange({ client: 'all', api: 'all', status: 'all', salesPerson: 'all' });
  };

  const update = (key: keyof GlobalFilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs relative">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Filters</span>
          {activeCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-foreground">Filters</h3>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={handleReset}>
              Reset all
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Client</p>
            <Select value={filters.client} onValueChange={v => update('client', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">APIs</p>
            <Select value={filters.api} onValueChange={v => update('api', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All APIs</SelectItem>
                {apis.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
            <Select value={filters.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Sales Person</p>
            <Select value={filters.salesPerson} onValueChange={v => update('salesPerson', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sales persons</SelectItem>
                {salesPersons.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Filters</p>
            <div className="flex flex-wrap gap-1.5">
              {filters.client !== 'all' && (
                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                  {filters.client}
                  <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => update('client', 'all')} />
                </Badge>
              )}
              {filters.api !== 'all' && (
                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                  {filters.api}
                  <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => update('api', 'all')} />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs gap-1 pr-1 capitalize">
                  {filters.status}
                  <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => update('status', 'all')} />
                </Badge>
              )}
              {filters.salesPerson !== 'all' && (
                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                  {filters.salesPerson}
                  <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => update('salesPerson', 'all')} />
                </Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Download, LogOut, Search, Calendar, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { UsageSource } from './UsageChart';

export type Environment = 'staging' | 'production';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardHeaderProps {
  environment: Environment;
  onEnvironmentChange: (env: Environment) => void;
  usageSource: UsageSource;
  onUsageSourceChange: (source: UsageSource) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchSuggestions: string[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onDownloadReport: () => void;
  onLogout: () => void;
  apiCount: number;
  clientCount: number;
}

export function DashboardHeader({
  environment,
  onEnvironmentChange,
  usageSource,
  onUsageSourceChange,
  searchQuery,
  onSearchChange,
  searchSuggestions,
  dateRange,
  onDateRangeChange,
  onDownloadReport,
  onLogout,
  apiCount,
  clientCount,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSelect = (value: string) => {
    onSearchChange(value);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const next = [value, ...prev.filter(s => s !== value)].slice(0, 5);
      return next;
    });
  };

  const filteredSuggestions = searchQuery.length > 0
    ? searchSuggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const dateLabel = dateRange.from
    ? dateRange.to
      ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
      : format(dateRange.from, 'MMM d, yyyy')
    : 'Select dates';

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between px-6 py-3 gap-4">
        {/* Left: Title + Env Badge + Usage Toggle */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">API Monitor</h1>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] uppercase tracking-wider font-semibold',
                environment === 'production'
                  ? 'border-success/50 text-success bg-success/10'
                  : 'border-warning/50 text-warning bg-warning/10'
              )}
            >
              {environment}
            </Badge>
          </div>

          {/* Environment Toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            {(['staging', 'production'] as Environment[]).map((env) => (
              <button
                key={env}
                onClick={() => onEnvironmentChange(env)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  environment === env
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </button>
            ))}
          </div>

          {/* Usage Source Toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            {(['overall', 'internal', 'external'] as UsageSource[]).map((source) => (
              <button
                key={source}
                onClick={() => onUsageSourceChange(source)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  usageSource === source
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs or clients..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="pl-9 h-9 text-sm"
          />
          {searchFocused && (filteredSuggestions.length > 0 || recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {searchQuery.length === 0 && recentSearches.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Recent</p>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearchSelect(s)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {filteredSuggestions.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Suggestions</p>
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearchSelect(s)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Date + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                {dateLabel}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={onDownloadReport} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Report</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-xs">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">API Monitor</h1>
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] uppercase tracking-wider font-semibold',
                environment === 'production'
                  ? 'border-success/50 text-success bg-success/10'
                  : 'border-warning/50 text-warning bg-warning/10'
              )}
            >
              {environment === 'production' ? 'PROD' : 'STG'}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile search - sticky */}
        <div className="px-4 pb-2">
          <div ref={searchRef} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search APIs or clients..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="pl-9 h-9 text-sm"
            />
            {searchFocused && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-2 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearchSelect(s)}
                      className="w-full text-left px-2 py-2 text-sm rounded hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile expandable menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border px-4 py-3 space-y-3 bg-background animate-fade-in">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Environment</p>
              <div className="flex bg-muted rounded-lg p-0.5">
                {(['staging', 'production'] as Environment[]).map((env) => (
                  <button
                    key={env}
                    onClick={() => onEnvironmentChange(env)}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      environment === env
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Usage Source</p>
              <div className="flex bg-muted rounded-lg p-0.5">
                {(['overall', 'internal', 'external'] as UsageSource[]).map((source) => (
                  <button
                    key={source}
                    onClick={() => onUsageSourceChange(source)}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      usageSource === source
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date Range</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs justify-start">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={onDownloadReport}>
                <Download className="w-3.5 h-3.5" />
                Download Report
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onLogout}>
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Monitoring {apiCount} APIs across {clientCount} clients
            </p>
          </div>
        )}
      </div>
    </header>
  );
}

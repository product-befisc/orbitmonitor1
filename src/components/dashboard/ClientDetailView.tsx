import { ArrowLeft, TrendingUp, TrendingDown, ChevronRight, Flag, LayoutDashboard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UsageChart } from './UsageChart';
import { ClientAPIDateTable } from './ClientAPIDateTable';
import { ClientSupportTicketsTab } from './ClientSupportTicketsTab';
import { ClientIPWhitelistTab } from './ClientIPWhitelistTab';
import { ClientUsageData, APIData, formatClientAge } from '@/lib/mockData';
import { hasNonWhitelistedIP } from '@/lib/mockClientIPs';
import { cn } from '@/lib/utils';

interface ClientDetailViewProps {
  clientData: ClientUsageData;
  clientAPIs: APIData[];
  onBack: () => void;
  onSelectAPI: (apiId: string) => void;
  onOpen360?: () => void;
}

export function ClientDetailView({ clientData, clientAPIs, onBack, onSelectAPI, onOpen360 }: ClientDetailViewProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(1)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  const sortedAPIs = [...clientAPIs].sort((a, b) => b.currentCalls - a.currentCalls);

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <Tabs defaultValue="performance" className="w-full">
        {/* Header row: back + name + tabs */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{clientData.client}</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-foreground/80 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatClientAge(clientData.clientAgeMonths)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {clientData.apiCount} APIs • {formatCalls(clientData.totalCalls)} total calls • Client since {formatClientAge(clientData.clientAgeMonths)} ago
            </p>
          </div>
          {onOpen360 && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpen360}
              className="ml-auto gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              360° View
            </Button>
          )}
          <TabsList className={onOpen360 ? '' : 'ml-auto'}>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="ips" className="gap-2">
              IP Whitelist
              {hasNonWhitelistedIP(clientData.client) && (
                <Flag className="w-3.5 h-3.5 text-destructive" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="performance" className="mt-0 space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-4">
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
          <div className="glass-card">
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

          {/* Date-wise API Breakdown Table */}
          <div className="glass-card p-5">
            <ClientAPIDateTable apis={sortedAPIs} />
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-0">
          <div className="glass-card p-5">
            <ClientSupportTicketsTab client={clientData.client} />
          </div>
        </TabsContent>

        <TabsContent value="ips" className="mt-0">
          <div className="glass-card p-5">
            <ClientIPWhitelistTab client={clientData.client} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

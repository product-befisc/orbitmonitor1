import { useState, useMemo } from 'react';
import { Activity, Zap, AlertTriangle, Server } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UsageChart, type UsageSource } from '@/components/dashboard/UsageChart';
import { ClientList } from '@/components/dashboard/ClientList';
import { ClientDetailView } from '@/components/dashboard/ClientDetailView';
import { APIRankingList } from '@/components/dashboard/APIRankingList';
import { APIDetailPanel } from '@/components/dashboard/APIDetailPanel';
import { AlertDetailView } from '@/components/dashboard/AlertDetailView';
import { DashboardHeader, type Environment, type DateRange } from '@/components/dashboard/DashboardHeader';
import { APIConsumptionChart, type StatusDayData } from '@/components/dashboard/APIConsumptionChart';
import { DrillDownDrawer } from '@/components/dashboard/DrillDownDrawer';
import { ComparisonTab } from '@/components/dashboard/ComparisonTab';
import { VendorAPIsTab } from '@/components/dashboard/VendorAPIsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { mockAPIs, getAggregatedStats, getClientUsageData } from '@/lib/mockData';
import { generateDailyReport } from '@/lib/reportGenerator';
import { toast } from '@/hooks/use-toast';

type DashboardView =
  | { type: 'overview' }
  | { type: 'client-detail'; clientName: string }
  | { type: 'api-detail'; apiId: string; fromClient?: string; fromAlert?: 'warning' | 'critical' }
  | { type: 'alert-detail'; alertType: 'warning' | 'critical' };

const Index = () => {
  const [view, setView] = useState<DashboardView>({ type: 'overview' });
  const [usageSource, setUsageSource] = useState<UsageSource>('overall');
  const [environment, setEnvironment] = useState<Environment>('production');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [drillDown, setDrillDown] = useState<{ dayData: StatusDayData; apis: typeof mockAPIs } | null>(null);

  const clientData = useMemo(() => getClientUsageData(mockAPIs), []);
  const stats = useMemo(() => getAggregatedStats(mockAPIs), []);
  const sortedAPIs = useMemo(() => [...mockAPIs].sort((a, b) => b.currentCalls - a.currentCalls), []);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    const names = mockAPIs.map(a => a.name);
    const clients = [...new Set(mockAPIs.map(a => a.client))];
    return [...clients, ...names];
  }, []);

  // Filter APIs by search
  const filteredAPIs = useMemo(() => {
    if (!searchQuery) return mockAPIs;
    const q = searchQuery.toLowerCase();
    return mockAPIs.filter(a =>
      a.name.toLowerCase().includes(q) || a.client.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredSortedAPIs = useMemo(() =>
    [...filteredAPIs].sort((a, b) => b.currentCalls - a.currentCalls), [filteredAPIs]);
  const filteredClientData = useMemo(() => getClientUsageData(filteredAPIs), [filteredAPIs]);
  const filteredStats = useMemo(() => getAggregatedStats(filteredAPIs), [filteredAPIs]);

  const aggregatedDailyData = useMemo(() => {
    const dataMap = new Map<string, { calls: number; previousCalls: number }>();
    filteredAPIs.forEach(api => {
      api.dailyData.forEach(d => {
        const existing = dataMap.get(d.date) || { calls: 0, previousCalls: 0 };
        existing.calls += d.calls;
        existing.previousCalls += d.previousCalls;
        dataMap.set(d.date, existing);
      });
    });
    return Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, calls: d.calls, previousCalls: d.previousCalls }));
  }, [filteredAPIs]);

  const aggregatedWeeklyData = useMemo(() => {
    const dataMap = new Map<string, { calls: number; previousCalls: number }>();
    filteredAPIs.forEach(api => {
      api.weeklyData.forEach(d => {
        const existing = dataMap.get(d.week) || { calls: 0, previousCalls: 0 };
        existing.calls += d.calls;
        existing.previousCalls += d.previousCalls;
        dataMap.set(d.week, existing);
      });
    });
    return Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, d]) => ({ week, calls: d.calls, previousCalls: d.previousCalls }));
  }, [filteredAPIs]);

  const aggregatedMonthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => {
      let calls = 0;
      let previousYear = 0;
      filteredAPIs.forEach(api => {
        const monthData = api.monthlyData.find(d => d.month === month);
        if (monthData) {
          calls += monthData.calls;
          previousYear += monthData.previousYear;
        }
      });
      return { month, calls, previousYear };
    });
  }, [filteredAPIs]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleDownloadReport = () => {
    generateDailyReport(mockAPIs);
    toast({ title: 'Report downloaded', description: 'Daily summary report has been saved.' });
  };

  const handleLogout = () => {
    toast({ title: 'Logged out', description: 'You have been logged out successfully.' });
  };

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
    toast({ title: `Switched to ${env}`, description: `Dashboard now showing ${env} data.` });
  };

  // Sub-views with header
  const renderWithHeader = (content: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        environment={environment}
        onEnvironmentChange={handleEnvironmentChange}
        usageSource={usageSource}
        onUsageSourceChange={setUsageSource}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchSuggestions={searchSuggestions}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onDownloadReport={handleDownloadReport}
        onLogout={handleLogout}
        apiCount={mockAPIs.length}
        clientCount={clientData.length}
      />
      {content}
    </div>
  );

  // Alert detail view
  if (view.type === 'alert-detail') {
    return renderWithHeader(
      <AlertDetailView
        alertType={view.alertType}
        apis={mockAPIs}
        onBack={() => setView({ type: 'overview' })}
        onSelectAPI={(apiId) => setView({ type: 'api-detail', apiId, fromAlert: view.alertType })}
      />
    );
  }

  // Client detail view
  if (view.type === 'client-detail') {
    const client = clientData.find(c => c.client === view.clientName);
    if (!client) return null;
    const clientAPIs = mockAPIs
      .filter(a => a.client === view.clientName)
      .sort((a, b) => b.currentCalls - a.currentCalls);
    return renderWithHeader(
      <ClientDetailView
        clientData={client}
        clientAPIs={clientAPIs}
        onBack={() => setView({ type: 'overview' })}
        onSelectAPI={(apiId) => setView({ type: 'api-detail', apiId, fromClient: view.clientName })}
      />
    );
  }

  // API detail view
  if (view.type === 'api-detail') {
    const api = mockAPIs.find(a => a.id === view.apiId);
    if (!api) return null;
    return renderWithHeader(
      <APIDetailPanel
        api={api}
        onBack={() => {
          if (view.fromAlert) {
            setView({ type: 'alert-detail', alertType: view.fromAlert });
          } else if (view.fromClient) {
            setView({ type: 'client-detail', clientName: view.fromClient });
          } else {
            setView({ type: 'overview' });
          }
        }}
      />
    );
  }

  // Overview
  return renderWithHeader(
    <div className="p-4 md:p-6 space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="vendor-apis">Vendor APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Subtitle - desktop only */}
          <p className="text-sm text-muted-foreground hidden md:block">
            Monitoring {filteredAPIs.length} APIs across {filteredClientData.length} clients
          </p>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <MetricCard
              title="Total API Calls"
              value={formatNumber(filteredStats.totalCalls)}
              previousValue={formatNumber(filteredStats.previousTotalCalls)}
              change={filteredStats.totalChange}
              subtitle="Last 24 hours"
              icon={<Zap className="w-5 h-5" />}
            />
            <MetricCard
              title="Active APIs"
              value={filteredStats.activeAPIs}
              subtitle={`${filteredStats.healthyCount} healthy`}
              icon={<Server className="w-5 h-5" />}
              status="healthy"
            />
            <MetricCard
              title="Warnings"
              value={filteredStats.warningCount}
              subtitle="Threshold breaches"
              icon={<AlertTriangle className="w-5 h-5" />}
              status={filteredStats.warningCount > 0 ? 'warning' : 'neutral'}
              onClick={filteredStats.warningCount > 0 ? () => setView({ type: 'alert-detail', alertType: 'warning' }) : undefined}
            />
            <MetricCard
              title="Critical Alerts"
              value={filteredStats.criticalCount}
              subtitle="Requires attention"
              icon={<Activity className="w-5 h-5" />}
              status={filteredStats.criticalCount > 0 ? 'critical' : 'neutral'}
              onClick={filteredStats.criticalCount > 0 ? () => setView({ type: 'alert-detail', alertType: 'critical' }) : undefined}
            />
          </div>

          {/* API Consumption - Stacked Bar Chart */}
          <APIConsumptionChart
            apis={filteredAPIs}
            usageSource={usageSource}
            onDayClick={(dayData, apis) => setDrillDown({ dayData, apis })}
          />

          {/* Aggregated Usage Chart */}
          <UsageChart
            dailyData={aggregatedDailyData}
            weeklyData={aggregatedWeeklyData}
            monthlyData={aggregatedMonthlyData}
            title="Usage Trends"
            usageSource={usageSource}
          />

          {/* Two-column: Client Usage | API Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClientList
              clients={filteredClientData}
              onSelectClient={(name) => setView({ type: 'client-detail', clientName: name })}
            />
            <APIRankingList
              apis={filteredSortedAPIs}
              onSelectAPI={(id) => setView({ type: 'api-detail', apiId: id })}
            />
          </div>

          {/* Drill-Down Drawer */}
          {drillDown && (
            <DrillDownDrawer
              dayData={drillDown.dayData}
              apis={drillDown.apis}
              open={!!drillDown}
              onClose={() => setDrillDown(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="comparison" className="mt-0">
          <ComparisonTab apis={filteredAPIs} />
        </TabsContent>

        <TabsContent value="vendor-apis" className="mt-0">
          <VendorAPIsTab apis={filteredAPIs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;

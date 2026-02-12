import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APIData } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { UsageChart } from './UsageChart';
import { StatusBreakdownChart } from './StatusBreakdownChart';

interface APIDetailPanelProps {
  api: APIData;
  onBack: () => void;
}

export function APIDetailPanel({ api, onBack }: APIDetailPanelProps) {
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) return `${(calls / 1000000).toFixed(2)}M`;
    if (calls >= 1000) return `${(calls / 1000).toFixed(1)}K`;
    return calls.toString();
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            api.status === 'healthy' && 'bg-success',
            api.status === 'warning' && 'bg-warning',
            api.status === 'critical' && 'bg-destructive pulse-dot'
          )} />
          <div>
            <h1 className="text-2xl font-bold font-mono">{api.name}</h1>
            <p className="text-sm text-muted-foreground">{api.client}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Current Calls</p>
          <p className="text-3xl font-semibold">{formatCalls(api.currentCalls)}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Previous Period</p>
          <p className="text-3xl font-semibold">{formatCalls(api.previousCalls)}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-1">Change</p>
          <div className={cn(
            'flex items-center gap-2 text-3xl font-semibold',
            api.trend > 0 && 'text-success',
            api.trend < -10 && 'text-destructive',
            api.trend < 0 && api.trend >= -10 && 'text-warning'
          )}>
            {api.trend > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {api.trend > 0 ? '+' : ''}{api.trend}%
          </div>
        </div>
        <div className={cn(
          'metric-card',
          api.currentCalls < api.threshold && 'border-destructive/50'
        )}>
          <div className="flex items-center gap-2 mb-1">
            {api.currentCalls < api.threshold && <AlertTriangle className="w-4 h-4 text-destructive" />}
            <p className="text-sm text-muted-foreground">Threshold</p>
          </div>
          <p className="text-3xl font-semibold">{formatCalls(api.threshold)}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="glass-card p-5 mb-6">
        <StatusBreakdownChart
          statusBreakdown={api.statusBreakdown}
          statusTimeline={api.statusTimeline}
        />
      </div>

      {/* Usage History */}
      <UsageChart
        dailyData={api.dailyData}
        weeklyData={api.weeklyData}
        monthlyData={api.monthlyData}
        title="Usage History"
      />
    </div>
  );
}

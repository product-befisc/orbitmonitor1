import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  onClick?: () => void;
}

export function MetricCard({ title, value, change, subtitle, icon, status = 'neutral', onClick }: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 5) return 'text-success';
    if (change < -10) return 'text-destructive';
    if (change < 0) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getStatusIndicator = () => {
    if (status === 'neutral') return null;
    return (
      <div className={cn(
        'w-2 h-2 rounded-full',
        status === 'healthy' && 'bg-success',
        status === 'warning' && 'bg-warning',
        status === 'critical' && 'bg-destructive pulse-dot'
      )} />
    );
  };

  return (
    <div
      className={cn('metric-card animate-fade-in', onClick && 'cursor-pointer hover:border-primary/50')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {getStatusIndicator()}
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

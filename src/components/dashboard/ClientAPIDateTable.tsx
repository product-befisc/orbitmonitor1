import { useState, useMemo } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { APIData } from '@/lib/mockData';

type DateFilterPeriod = 'last-day' | 'last-7-days' | 'monthly' | 'quarterly';

function generateDateColumns(period: DateFilterPeriod): { label: string; seed: number }[] {
  const now = new Date();
  switch (period) {
    case 'last-day':
      return Array.from({ length: 6 }, (_, i) => {
        const hour = (24 - (5 - i) * 4);
        return { label: `${String(hour % 24).padStart(2, '0')}:00`, seed: i + 1 };
      });
    case 'last-7-days':
      return Array.from({ length: 7 }, (_, i) => {
        const d = subDays(now, 6 - i);
        return { label: format(d, 'MMM dd'), seed: d.getDate() };
      });
    case 'monthly':
      return Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, 5 - i);
        return { label: format(d, 'MMM yyyy'), seed: d.getMonth() + 1 + i };
      });
    case 'quarterly':
      return Array.from({ length: 4 }, (_, i) => {
        const d = subMonths(now, (3 - i) * 3);
        const q = Math.ceil((d.getMonth() + 1) / 3);
        return { label: `Q${q} ${format(d, 'yyyy')}`, seed: q * 10 + i };
      });
  }
}

function generateCellData(apiCalls: number, seed: number, apiSeed: number) {
  const rng = ((seed * 31 + apiSeed * 17) % 97) / 97;
  const totalHits = Math.round(apiCalls * (0.05 + rng * 0.3));
  const successPct = 75 + rng * 20;
  const sourceDownPct = 2 + (1 - rng) * 10;
  const othersPct = 100 - successPct - sourceDownPct;
  const success = Math.round(totalHits * successPct / 100);
  const sourceDown = Math.round(totalHits * sourceDownPct / 100);
  const others = totalHits - success - sourceDown;

  // Previous period data (use a shifted seed)
  const prevRng = ((seed * 23 + apiSeed * 13 + 7) % 89) / 89;
  const prevTotalHits = Math.round(apiCalls * (0.04 + prevRng * 0.28));
  const changePct = prevTotalHits > 0 ? ((totalHits - prevTotalHits) / prevTotalHits) * 100 : 0;

  return { totalHits, success, sourceDown, others, successPct: successPct.toFixed(1), sourceDownPct: sourceDownPct.toFixed(1), othersPct: othersPct.toFixed(1), prevTotalHits, changePct };
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

interface ClientAPIDateTableProps {
  apis: APIData[];
}

export function ClientAPIDateTable({ apis }: ClientAPIDateTableProps) {
  const [period, setPeriod] = useState<DateFilterPeriod>('monthly');
  const columns = useMemo(() => generateDateColumns(period), [period]);

  const periods: { value: DateFilterPeriod; label: string }[] = [
    { value: 'last-day', label: 'Last Day' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  const sortedApis = [...apis].sort((a, b) => b.currentCalls - a.currentCalls);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">Date-wise API Breakdown</h4>
        <div className="flex bg-muted rounded-lg p-0.5">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all',
                period === p.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[10px] min-w-[700px]">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r border-border min-w-[120px]">API Name</th>
              {columns.map(col => (
                <th key={col.label} className="px-2 py-2 text-center font-semibold text-muted-foreground border-r border-border last:border-r-0 min-w-[110px]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedApis.map(api => {
              const apiSeed = api.id.charCodeAt(0) + api.id.charCodeAt(api.id.length - 1);
              return (
                <tr key={api.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground border-r border-border truncate max-w-[140px]" title={api.name}>
                    {api.name}
                  </td>
                  {columns.map(col => {
                    const cell = generateCellData(api.currentCalls, col.seed, apiSeed);
                    return (
                      <td key={col.label} className="px-2 py-1.5 border-r border-border last:border-r-0">
                        <div className="space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Hits:</span>
                            <span className="font-semibold">{formatNumber(cell.totalHits)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-success">Success:</span>
                            <span className="font-medium text-success">{formatNumber(cell.success)} ({cell.successPct}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-warning">Src Down:</span>
                            <span className="font-medium text-warning">{formatNumber(cell.sourceDown)} ({cell.sourceDownPct}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Others:</span>
                            <span className="font-medium">{formatNumber(cell.others)} ({cell.othersPct}%)</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

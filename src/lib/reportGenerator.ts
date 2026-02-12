import { APIData } from './mockData';

export function generateDailyReport(apis: APIData[]): void {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const totalCalls = apis.reduce((s, a) => s + a.currentCalls, 0);
  const warningAPIs = apis.filter(a => a.status === 'warning');
  const criticalAPIs = apis.filter(a => a.status === 'critical');
  const healthyAPIs = apis.filter(a => a.status === 'healthy');

  const lines: string[] = [
    `API MONITORING — DAILY SUMMARY REPORT`,
    `Report Date: ${dateStr}`,
    `Generated: ${now.toISOString()}`,
    `${'='.repeat(60)}`,
    ``,
    `OVERVIEW`,
    `--------`,
    `Total APIs Monitored: ${apis.length}`,
    `Total API Calls (Last 24h): ${totalCalls.toLocaleString()}`,
    `Healthy: ${healthyAPIs.length}  |  Warning: ${warningAPIs.length}  |  Critical: ${criticalAPIs.length}`,
    ``,
  ];

  if (criticalAPIs.length > 0) {
    lines.push(`CRITICAL ALERTS (${criticalAPIs.length})`);
    lines.push(`${'─'.repeat(40)}`);
    criticalAPIs.forEach(api => {
      lines.push(`  • ${api.name} [${api.client}]`);
      lines.push(`    Calls: ${api.currentCalls.toLocaleString()} | Trend: ${api.trend}% | Threshold: ${api.threshold.toLocaleString()}`);
    });
    lines.push(``);
  }

  if (warningAPIs.length > 0) {
    lines.push(`WARNING ALERTS (${warningAPIs.length})`);
    lines.push(`${'─'.repeat(40)}`);
    warningAPIs.forEach(api => {
      lines.push(`  • ${api.name} [${api.client}]`);
      lines.push(`    Calls: ${api.currentCalls.toLocaleString()} | Trend: ${api.trend}% | Threshold: ${api.threshold.toLocaleString()}`);
    });
    lines.push(``);
  }

  // Top 10 by usage
  lines.push(`TOP 10 APIs BY USAGE`);
  lines.push(`${'─'.repeat(40)}`);
  [...apis]
    .sort((a, b) => b.currentCalls - a.currentCalls)
    .slice(0, 10)
    .forEach((api, i) => {
      lines.push(`  ${i + 1}. ${api.name} — ${api.currentCalls.toLocaleString()} calls (${api.trend > 0 ? '+' : ''}${api.trend}%)`);
    });
  lines.push(``);

  // Client summary
  const clientMap = new Map<string, { calls: number; count: number; warnings: number; criticals: number }>();
  apis.forEach(api => {
    const c = clientMap.get(api.client) || { calls: 0, count: 0, warnings: 0, criticals: 0 };
    c.calls += api.currentCalls;
    c.count += 1;
    if (api.status === 'warning') c.warnings += 1;
    if (api.status === 'critical') c.criticals += 1;
    clientMap.set(api.client, c);
  });

  lines.push(`CLIENT SUMMARY`);
  lines.push(`${'─'.repeat(40)}`);
  Array.from(clientMap.entries())
    .sort((a, b) => b[1].calls - a[1].calls)
    .forEach(([client, data]) => {
      const alerts = data.warnings + data.criticals;
      lines.push(`  ${client}: ${data.calls.toLocaleString()} calls, ${data.count} APIs${alerts > 0 ? ` (${alerts} alert${alerts > 1 ? 's' : ''})` : ''}`);
    });

  lines.push(``);
  lines.push(`${'='.repeat(60)}`);
  lines.push(`End of Report`);

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-report-${dateStr}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

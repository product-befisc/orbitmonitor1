// Mock data generator for 150+ APIs

export interface APIData {
  id: string;
  name: string;
  client: string;
  status: 'healthy' | 'warning' | 'critical';
  currentCalls: number;
  previousCalls: number;
  threshold: number;
  relativeThreshold: number; // percentage drop threshold
  trend: number; // percentage change
  dailyData: { date: string; calls: number }[];
  weeklyData: { week: string; calls: number }[];
  monthlyData: { month: string; calls: number; previousYear: number }[];
  statusBreakdown: { success: number; sourceDown: number; notFound: number; otherError: number };
  statusTimeline: { date: string; success: number; sourceDown: number; notFound: number; otherError: number }[];
}

const clients = [
  'Acme Corp', 'TechFlow', 'DataSync', 'CloudBase', 'NetPrime',
  'InfoSys', 'ByteWorks', 'CodeStream', 'DevOps Pro', 'SaaS Hub',
  'API Connect', 'IntegrateIO', 'FlowLogic', 'DataBridge', 'SyncMaster'
];

// Readable API names instead of endpoints
const apiNames = [
  'User Authentication', 'Password Reset', 'Session Manager', 'Token Validator',
  'Payment Gateway', 'Invoice Generator', 'Subscription Handler', 'Refund Processor',
  'Order Tracker', 'Cart Manager', 'Checkout Flow', 'Shipping Calculator',
  'Product Catalog', 'Inventory Sync', 'Stock Alerts', 'Price Updater',
  'Analytics Engine', 'Report Builder', 'Dashboard Metrics', 'Usage Tracker',
  'Push Notifications', 'Email Sender', 'SMS Gateway', 'Webhook Dispatcher',
  'Search Index', 'Autocomplete', 'Filter Engine', 'Sort Handler',
  'Recommendation Engine', 'Personalization', 'A/B Testing', 'Feature Flags',
  'Billing Calculator', 'Tax Engine', 'Currency Converter', 'Payment Retry',
  'File Uploader', 'Image Processor', 'Document Parser', 'Storage Manager',
  'Cache Layer', 'Queue Manager', 'Job Scheduler', 'Background Worker',
  'Audit Logger', 'Error Tracker', 'Health Monitor', 'Performance Profiler',
  'User Profiles', 'Preferences API', 'Settings Sync', 'Config Manager',
  'Team Manager', 'Role Permissions', 'Access Control', 'SSO Handler',
  'Data Export', 'Bulk Import', 'Migration Tool', 'Backup Service',
  'Rate Limiter', 'Throttle Controller', 'Quota Manager', 'Usage Meter',
  'Geolocation API', 'Timezone Handler', 'Language Detector', 'Translation API',
  'Social Auth', 'OAuth Handler', 'API Key Manager', 'Secret Vault',
  'Comment System', 'Review Handler', 'Rating Calculator', 'Feedback Collector',
  'Chat Service', 'Presence Tracker', 'Typing Indicator', 'Message History',
  'Video Processor', 'Audio Transcoder', 'Thumbnail Generator', 'Media CDN',
  'Form Validator', 'Captcha Service', 'Spam Filter', 'Content Moderator',
  'Event Stream', 'Activity Feed', 'Notification Center', 'Alert Manager',
  'Customer Support', 'Ticket System', 'Knowledge Base', 'FAQ Handler',
  'Loyalty Points', 'Rewards Engine', 'Coupon Validator', 'Promo Handler',
  'Affiliate Tracker', 'Referral System', 'Commission Calculator', 'Partner API',
  'Compliance Check', 'GDPR Handler', 'Data Anonymizer', 'Consent Manager',
  'Integration Hub', 'Connector API', 'Sync Bridge', 'Data Transform',
  'Mobile Push', 'App Analytics', 'Crash Reporter', 'Session Replay',
  'Voice API', 'Call Router', 'IVR Handler', 'Call Recording',
  'Map Service', 'Route Planner', 'Distance Calculator', 'POI Finder',
  'Weather API', 'Climate Data', 'Forecast Engine', 'Alert Service',
  'Stock Tracker', 'Market Data', 'Trade Executor', 'Portfolio Manager'
];

function generateDailyData(): { date: string; calls: number }[] {
  const data = [];
  const baseValue = Math.random() * 50000 + 10000;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variance = (Math.random() - 0.5) * 0.4;
    data.push({
      date: date.toISOString().split('T')[0],
      calls: Math.round(baseValue * (1 + variance))
    });
  }
  return data;
}

function generateWeeklyData(): { week: string; calls: number }[] {
  const data = [];
  const baseValue = Math.random() * 300000 + 50000;
  for (let i = 11; i >= 0; i--) {
    const variance = (Math.random() - 0.5) * 0.3;
    data.push({
      week: `W${52 - i}`,
      calls: Math.round(baseValue * (1 + variance))
    });
  }
  return data;
}

function generateMonthlyData(): { month: string; calls: number; previousYear: number }[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseValue = Math.random() * 1000000 + 200000;
  return months.map(month => {
    const currentVariance = (Math.random() - 0.5) * 0.3;
    const previousVariance = (Math.random() - 0.5) * 0.3;
    return {
      month,
      calls: Math.round(baseValue * (1 + currentVariance)),
      previousYear: Math.round(baseValue * 0.85 * (1 + previousVariance))
    };
  });
}

function generateStatusBreakdown(totalCalls: number) {
  const successRate = 0.85 + Math.random() * 0.12;
  const success = Math.round(totalCalls * successRate);
  const remaining = totalCalls - success;
  const sourceDown = Math.round(remaining * (0.2 + Math.random() * 0.3));
  const notFound = Math.round(remaining * (0.1 + Math.random() * 0.3));
  const otherError = Math.max(0, remaining - sourceDown - notFound);
  return { success, sourceDown, notFound, otherError };
}

function generateStatusTimeline() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const base = Math.random() * 50000 + 10000;
    const successRate = 0.85 + Math.random() * 0.12;
    const success = Math.round(base * successRate);
    const remaining = Math.round(base - success);
    const sourceDown = Math.round(remaining * (0.2 + Math.random() * 0.3));
    const notFound = Math.round(remaining * (0.1 + Math.random() * 0.3));
    const otherError = Math.max(0, remaining - sourceDown - notFound);
    data.push({ date: date.toISOString().split('T')[0], success, sourceDown, notFound, otherError });
  }
  return data;
}

function generateAPIName(index: number): string {
  return apiNames[index % apiNames.length];
}

function determineStatus(currentCalls: number, previousCalls: number, threshold: number, relativeThreshold: number): 'healthy' | 'warning' | 'critical' {
  const percentChange = ((currentCalls - previousCalls) / previousCalls) * 100;
  
  if (currentCalls < threshold * 0.5 || percentChange < -relativeThreshold * 1.5) {
    return 'critical';
  }
  if (currentCalls < threshold || percentChange < -relativeThreshold) {
    return 'warning';
  }
  return 'healthy';
}

export function generateMockAPIs(count: number = 156): APIData[] {
  const apis: APIData[] = [];
  
  for (let i = 0; i < count; i++) {
    const dailyData = generateDailyData();
    const currentCalls = dailyData[dailyData.length - 1].calls;
    const previousCalls = dailyData[dailyData.length - 8].calls; // Compare to week ago
    const threshold = Math.round(currentCalls * (0.3 + Math.random() * 0.3));
    const relativeThreshold = 15 + Math.random() * 15; // 15-30%
    const trend = ((currentCalls - previousCalls) / previousCalls) * 100;
    
    apis.push({
      id: `api-${i + 1}`,
      name: generateAPIName(i),
      client: clients[i % clients.length],
      status: determineStatus(currentCalls, previousCalls, threshold, relativeThreshold),
      currentCalls,
      previousCalls,
      threshold,
      relativeThreshold: Math.round(relativeThreshold),
      trend: Math.round(trend * 10) / 10,
      dailyData,
      weeklyData: generateWeeklyData(),
      monthlyData: generateMonthlyData(),
      statusBreakdown: generateStatusBreakdown(currentCalls),
      statusTimeline: generateStatusTimeline()
    });
  }
  
  // Ensure some APIs have warning/critical status for demo
  apis[3].status = 'warning';
  apis[3].trend = -18.5;
  apis[7].status = 'critical';
  apis[7].trend = -42.3;
  apis[12].status = 'warning';
  apis[12].trend = -22.1;
  apis[18].status = 'critical';
  apis[18].trend = -55.8;
  apis[25].status = 'warning';
  apis[25].trend = -19.4;
  
  return apis;
}

export const mockAPIs = generateMockAPIs();

export function getAggregatedStats(apis: APIData[]) {
  const totalCalls = apis.reduce((sum, api) => sum + api.currentCalls, 0);
  const previousTotalCalls = apis.reduce((sum, api) => sum + api.previousCalls, 0);
  const healthyCount = apis.filter(api => api.status === 'healthy').length;
  const warningCount = apis.filter(api => api.status === 'warning').length;
  const criticalCount = apis.filter(api => api.status === 'critical').length;
  
  return {
    totalCalls,
    previousTotalCalls,
    totalChange: ((totalCalls - previousTotalCalls) / previousTotalCalls) * 100,
    activeAPIs: apis.length,
    healthyCount,
    warningCount,
    criticalCount,
    alertCount: warningCount + criticalCount
  };
}

export function getUniqueClients(apis: APIData[]): string[] {
  return [...new Set(apis.map(api => api.client))];
}

export function getTopClientsByUsage(apis: APIData[], topN: number = 10): { topClients: string[]; otherClients: string[] } {
  const clientUsage = new Map<string, number>();
  
  apis.forEach(api => {
    clientUsage.set(api.client, (clientUsage.get(api.client) || 0) + api.currentCalls);
  });
  
  const sortedClients = Array.from(clientUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([client]) => client);
  
  return {
    topClients: sortedClients.slice(0, topN),
    otherClients: sortedClients.slice(topN)
  };
}

export interface ClientUsageData {
  client: string;
  totalCalls: number;
  apiCount: number;
  trend: number;
  dailyData: { date: string; calls: number }[];
  weeklyData: { week: string; calls: number }[];
  monthlyData: { month: string; calls: number; previousYear: number }[];
}

export function getClientUsageData(apis: APIData[]): ClientUsageData[] {
  const clientMap = new Map<string, {
    totalCalls: number;
    previousCalls: number;
    apiCount: number;
    dailyData: Map<string, number>;
    weeklyData: Map<string, number>;
    monthlyData: Map<string, { calls: number; previousYear: number }>;
  }>();

  apis.forEach(api => {
    const existing = clientMap.get(api.client) || {
      totalCalls: 0,
      previousCalls: 0,
      apiCount: 0,
      dailyData: new Map(),
      weeklyData: new Map(),
      monthlyData: new Map()
    };

    existing.totalCalls += api.currentCalls;
    existing.previousCalls += api.previousCalls;
    existing.apiCount += 1;

    api.dailyData.forEach(d => {
      existing.dailyData.set(d.date, (existing.dailyData.get(d.date) || 0) + d.calls);
    });

    api.weeklyData.forEach(d => {
      existing.weeklyData.set(d.week, (existing.weeklyData.get(d.week) || 0) + d.calls);
    });

    api.monthlyData.forEach(d => {
      const prev = existing.monthlyData.get(d.month) || { calls: 0, previousYear: 0 };
      existing.monthlyData.set(d.month, {
        calls: prev.calls + d.calls,
        previousYear: prev.previousYear + d.previousYear
      });
    });

    clientMap.set(api.client, existing);
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return Array.from(clientMap.entries())
    .map(([client, data]) => ({
      client,
      totalCalls: data.totalCalls,
      apiCount: data.apiCount,
      trend: ((data.totalCalls - data.previousCalls) / data.previousCalls) * 100,
      dailyData: Array.from(data.dailyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, calls]) => ({ date, calls })),
      weeklyData: Array.from(data.weeklyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, calls]) => ({ week, calls })),
      monthlyData: months.map(month => {
        const d = data.monthlyData.get(month) || { calls: 0, previousYear: 0 };
        return { month, calls: d.calls, previousYear: d.previousYear };
      })
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls);
}

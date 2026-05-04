export interface SupportTicket {
  id: string;
  client: string;
  category: 'API\'s Issue' | 'Integration' | 'Billing' | 'Access Request' | 'Performance';
  date: string;
  time: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdBy: string;
  aiSummary: string;
  chatDescription: string;
  /** Resolution time in minutes. Only set for CLOSED tickets. */
  slaResolutionMinutes?: number;
}

/** Format SLA for display in tables. */
export function formatSLA(ticket: Pick<SupportTicket, 'status' | 'slaResolutionMinutes'>): string {
  if (ticket.status !== 'CLOSED' || ticket.slaResolutionMinutes == null) {
    return 'Not generated yet';
  }
  const mins = ticket.slaResolutionMinutes;
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  if (hours < 24) return remMin ? `${hours}h ${remMin}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

const clients = [
  'Anuvaad Financial Consultants Private Limited',
  'Extrapolate Advisors Private Limited',
  'VFUTURX RISK ASSURANCE ADVISORS PRIVATE LIMITED',
  'SPRINGROLE INDIA PRIVATE LIMITED',
  'Quagga Tech Private Limited',
  'Acme Corp',
  'TechFlow Solutions',
  'DataSync Analytics',
  'CloudBase Systems',
  'NetPrime Technologies',
];

const categories: SupportTicket['category'][] = [
  "API's Issue", 'Integration', 'Billing', 'Access Request', 'Performance',
];

const creators = [
  'tanweer.ahmad@befisc.com',
  'support@befisc.com',
  'ops@befisc.com',
  'admin@befisc.com',
];

const summaries = [
  'Client requested the EPFO API staging key again via WhatsApp message.\nProvided phone number contact and asked for the key to be shared.\n**Befisc Support:** Befisc Support team response was not included in the conversation excerpt.\nNo further troubleshooting or details provided.\n**OrbitAI:** In Progress\nIn Progress',
  'Client reported 500 errors on the PAN Verification API.\nErrors started occurring after the latest deployment.\n**Befisc Support:** Team is investigating the root cause.\n**OrbitAI:** Analyzing error patterns\nOpen',
  'Client requested access to production environment for GST API.\nNeed API keys and documentation for integration.\n**Befisc Support:** Credentials shared via secure channel.\n**OrbitAI:** Resolved\nClosed',
  'Client reported high latency on Aadhaar Verification API.\nResponse times exceeding 10 seconds during peak hours.\n**Befisc Support:** Scaling up infrastructure.\n**OrbitAI:** Monitoring\nIn Progress',
  'Client facing authentication failures on Bank Statement API.\nToken expiration not handled correctly on client side.\n**Befisc Support:** Shared updated documentation for token refresh.\n**OrbitAI:** Pending client confirmation\nOpen',
];

const chatDescriptions = [
  '[20:08, 17/03/2026] +91 91871 14710: Hi Team, can you please share epfo api staging key again',
  '[18:15, 17/03/2026] +91 98765 43210: We are getting 500 errors on PAN API since morning. Please check urgently.',
  '[17:05, 17/03/2026] +91 87654 32109: Need production API keys for GST verification. Client onboarding is pending.',
  '[15:58, 17/03/2026] +91 76543 21098: Aadhaar API response time is very high. Our users are complaining.',
  '[14:01, 17/03/2026] +91 65432 10987: Bank statement API auth is failing. Getting 401 errors consistently.',
];

function generateTickets(): SupportTicket[] {
  const tickets: SupportTicket[] = [];
  const baseDate = new Date('2026-03-17');

  for (let i = 0; i < 113; i++) {
    const dayOffset = Math.floor(i / 8);
    const date = new Date(baseDate);
    date.setDate(date.getDate() - dayOffset);

    const hours = 8 + Math.floor(Math.random() * 14);
    const minutes = Math.floor(Math.random() * 60);

    tickets.push({
      id: `OS-${(94 - i + 113).toString()}`,
      client: clients[i % clients.length],
      category: categories[i % categories.length],
      date: date.toISOString().split('T')[0],
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`,
      status: i < 100 ? 'OPEN' : i < 110 ? 'IN_PROGRESS' : 'CLOSED',
      createdBy: creators[i % creators.length],
      aiSummary: summaries[i % summaries.length],
      chatDescription: chatDescriptions[i % chatDescriptions.length],
    });
  }

  return tickets;
}

export const mockTickets = generateTickets();

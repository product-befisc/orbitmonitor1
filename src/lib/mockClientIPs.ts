export interface ClientIPEntry {
  ip: string;
  label: string;
  whitelisted: boolean;
  addedOn: string;
}

// Deterministic mock data per client. Some clients intentionally have
// non-whitelisted IPs to demonstrate the red flag state.
const SEED_IPS: Record<string, ClientIPEntry[]> = {};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getClientIPs(client: string): ClientIPEntry[] {
  if (SEED_IPS[client]) return SEED_IPS[client];
  const h = hashString(client);
  const count = 2 + (h % 3); // 2-4 IPs
  const entries: ClientIPEntry[] = [];
  for (let i = 0; i < count; i++) {
    const oct = (h >> (i * 3)) & 0xff;
    entries.push({
      ip: `192.168.${oct % 255}.${(oct * (i + 1)) % 255}`,
      label: i === 0 ? 'Production' : i === 1 ? 'Staging' : `Server ${i}`,
      // Make ~30% of clients have at least one non-whitelisted IP
      whitelisted: !((h + i) % 4 === 0),
      addedOn: `2026-0${1 + (i % 3)}-${10 + (i % 18)}`,
    });
  }
  SEED_IPS[client] = entries;
  return entries;
}

export function hasNonWhitelistedIP(client: string): boolean {
  return getClientIPs(client).some(e => !e.whitelisted);
}

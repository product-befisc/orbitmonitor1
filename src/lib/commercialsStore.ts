import { useSyncExternalStore } from 'react';
import type { CommercialData } from '@/components/dashboard/CommercialBuilder';

export interface SavedCommercial {
  id: string;
  name: string; // user-chosen save name
  data: CommercialData;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialShareRecord {
  id: string;
  commercialId: string;
  commercialName: string;
  clientName: string;
  recipients: string[];
  cc: string;
  subject: string;
  body: string;
  sharedBy: string;
  sharedAt: string;
}

const ADMIN_EMAIL = 'admin@befisc.com';
const CURRENT_USER = 'analyst@befisc.com';

// ---- in-memory state with subscribers ----
let commercials: SavedCommercial[] = [
  {
    id: 'c-demo-1',
    name: 'Bancwise — FY 2025-26',
    createdAt: '2025-04-12 10:30',
    updatedAt: '2025-04-15 14:20',
    data: {
      serviceProvider: 'BEFISC PRIVATE LIMITED',
      clientName: 'BANCWISE TECHNOLOGIES LLP',
      proposalDate: new Date('2025-04-12'),
      validityDays: 30,
      walletRecharge: 25000,
      walletRechargeNote:
        'Post wallet consumption, billing will automatically shift to postpaid, with invoices raised in the following month for that month\u2019s usage.',
      setupFees: 50000,
      setupFeesWaived: true,
      amcFees: 25000,
      amcWaived: true,
      minMonthly: 50000,
      minMonthlyWaived: true,
      rows: {},
      notes: '',
    },
  },
];

let shareHistory: CommercialShareRecord[] = [
  {
    id: 'csh-1',
    commercialId: 'c-demo-1',
    commercialName: 'Bancwise — FY 2025-26',
    clientName: 'BANCWISE TECHNOLOGIES LLP',
    recipients: ['procurement@bancwise.com'],
    cc: ADMIN_EMAIL,
    subject: 'BeFiSc — Commercial Proposal FY 2025-26',
    body: 'Hi team,\n\nPlease find attached the commercial proposal as discussed.\n\nRegards,\nBeFiSc',
    sharedBy: CURRENT_USER,
    sharedAt: '2025-04-15 14:25',
  },
];

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const emit = () => listeners.forEach(l => l());

const getCommercials = () => commercials;
const getShareHistory = () => shareHistory;

export function useCommercials() {
  return useSyncExternalStore(subscribe, getCommercials, getCommercials);
}

export function useCommercialShareHistory() {
  return useSyncExternalStore(subscribe, getShareHistory, getShareHistory);
}

export function saveCommercial(input: {
  id?: string;
  name: string;
  data: CommercialData;
}): SavedCommercial {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  if (input.id) {
    const idx = commercials.findIndex(c => c.id === input.id);
    if (idx >= 0) {
      const updated: SavedCommercial = {
        ...commercials[idx],
        name: input.name,
        data: input.data,
        updatedAt: now,
      };
      commercials = [updated, ...commercials.filter((_, i) => i !== idx)];
      emit();
      return updated;
    }
  }
  const created: SavedCommercial = {
    id: `c-${Date.now()}`,
    name: input.name,
    data: input.data,
    createdAt: now,
    updatedAt: now,
  };
  commercials = [created, ...commercials];
  emit();
  return created;
}

export function deleteCommercial(id: string) {
  commercials = commercials.filter(c => c.id !== id);
  emit();
}

export function recordCommercialShare(input: {
  commercialId: string;
  commercialName: string;
  clientName: string;
  recipients: string[];
  subject: string;
  body: string;
}) {
  const record: CommercialShareRecord = {
    id: `csh-${Date.now()}`,
    commercialId: input.commercialId,
    commercialName: input.commercialName,
    clientName: input.clientName,
    recipients: input.recipients,
    cc: ADMIN_EMAIL,
    subject: input.subject,
    body: input.body,
    sharedBy: CURRENT_USER,
    sharedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  shareHistory = [record, ...shareHistory];
  emit();
  return record;
}

export const COMMERCIAL_ADMIN_EMAIL = ADMIN_EMAIL;
export const COMMERCIAL_CURRENT_USER = CURRENT_USER;

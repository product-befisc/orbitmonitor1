import { useState, useMemo } from 'react';
import { Search, FileText, Download, ExternalLink, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface APIDoc {
  id: string;
  name: string;
  category: string;
  status: 'Live' | 'Discontinued';
  docUrl: string;
  description: string;
}

const API_DOCS: APIDoc[] = [
  // KYC
  { id: 'kyc-1', name: 'PAN Verification API', category: 'KYC', status: 'Live', docUrl: '#', description: 'Verify PAN card details in real-time' },
  { id: 'kyc-2', name: 'Aadhaar Verification API', category: 'KYC', status: 'Live', docUrl: '#', description: 'Aadhaar-based identity verification' },
  { id: 'kyc-3', name: 'Voter ID Verification API', category: 'KYC', status: 'Live', docUrl: '#', description: 'Verify Voter ID card details' },
  { id: 'kyc-4', name: 'Passport Verification API', category: 'KYC', status: 'Discontinued', docUrl: '#', description: 'Passport validation and verification' },
  { id: 'kyc-5', name: 'Driving License Verification API', category: 'KYC', status: 'Live', docUrl: '#', description: 'DL number verification and details fetch' },
  { id: 'kyc-6', name: 'Face Match API', category: 'KYC', status: 'Live', docUrl: '#', description: 'AI-powered face comparison and liveness' },

  // KYB
  { id: 'kyb-1', name: 'GST Verification API', category: 'KYB', status: 'Live', docUrl: '#', description: 'Verify GSTIN and fetch business details' },
  { id: 'kyb-2', name: 'MCA Company Search API', category: 'KYB', status: 'Live', docUrl: '#', description: 'Search and verify company details from MCA' },
  { id: 'kyb-3', name: 'FSSAI License Verification API', category: 'KYB', status: 'Live', docUrl: '#', description: 'Verify FSSAI license details' },
  { id: 'kyb-4', name: 'Shop & Establishment API', category: 'KYB', status: 'Discontinued', docUrl: '#', description: 'Verify shop and establishment registration' },
  { id: 'kyb-5', name: 'UDYAM Registration API', category: 'KYB', status: 'Live', docUrl: '#', description: 'Verify MSME Udyam registration' },

  // Mobile Number Lookup
  { id: 'mob-1', name: 'Mobile Number to Name API', category: 'Mobile Number Lookup', status: 'Live', docUrl: '#', description: 'Fetch name associated with a mobile number' },
  { id: 'mob-2', name: 'Mobile Number Verification API', category: 'Mobile Number Lookup', status: 'Live', docUrl: '#', description: 'Verify if a mobile number is active' },
  { id: 'mob-3', name: 'Mobile to Aadhaar Link Check API', category: 'Mobile Number Lookup', status: 'Live', docUrl: '#', description: 'Check Aadhaar linkage with mobile number' },

  // Digital Footprint
  { id: 'df-1', name: 'Email Risk Score API', category: 'Digital Footprint', status: 'Live', docUrl: '#', description: 'Assess risk score for email addresses' },
  { id: 'df-2', name: 'Social Media Lookup API', category: 'Digital Footprint', status: 'Live', docUrl: '#', description: 'Lookup social media profiles from identifiers' },
  { id: 'df-3', name: 'Digital Identity Verification API', category: 'Digital Footprint', status: 'Discontinued', docUrl: '#', description: 'Verify digital identity across platforms' },

  // Utility
  { id: 'util-1', name: 'IFSC Code Lookup API', category: 'Utility', status: 'Live', docUrl: '#', description: 'Fetch bank branch details by IFSC code' },
  { id: 'util-2', name: 'Pincode Lookup API', category: 'Utility', status: 'Live', docUrl: '#', description: 'Get location details from pincode' },
  { id: 'util-3', name: 'Email Verification API', category: 'Utility', status: 'Live', docUrl: '#', description: 'Validate email address deliverability' },
  { id: 'util-4', name: 'OCR Document Parser API', category: 'Utility', status: 'Live', docUrl: '#', description: 'Extract text and data from documents' },

  // Fraud Check
  { id: 'fraud-1', name: 'Bank Account Fraud Check API', category: 'Fraud Check', status: 'Live', docUrl: '#', description: 'Detect fraudulent bank accounts' },
  { id: 'fraud-2', name: 'Device Fingerprint API', category: 'Fraud Check', status: 'Live', docUrl: '#', description: 'Identify devices for fraud prevention' },
  { id: 'fraud-3', name: 'IP Risk Assessment API', category: 'Fraud Check', status: 'Live', docUrl: '#', description: 'Assess risk based on IP address' },
  { id: 'fraud-4', name: 'UPI Fraud Detection API', category: 'Fraud Check', status: 'Discontinued', docUrl: '#', description: 'Detect suspicious UPI transactions' },

  // Financial Check
  { id: 'fin-1', name: 'CIBIL Score Fetch API', category: 'Financial Check', status: 'Live', docUrl: '#', description: 'Fetch consumer credit score and report' },
  { id: 'fin-2', name: 'CRIF Report API', category: 'Financial Check', status: 'Live', docUrl: '#', description: 'Fetch CRIF credit report' },
  { id: 'fin-3', name: 'Bank Statement Analysis API', category: 'Financial Check', status: 'Live', docUrl: '#', description: 'Parse and analyze bank statements' },
  { id: 'fin-4', name: 'ITR Verification API', category: 'Financial Check', status: 'Live', docUrl: '#', description: 'Fetch and verify income tax returns' },

  // Vehicle Verification Live
  { id: 'veh-1', name: 'RC Verification API', category: 'Vehicle Verification Live', status: 'Live', docUrl: '#', description: 'Verify vehicle registration certificate' },
  { id: 'veh-2', name: 'Challan Check API', category: 'Vehicle Verification Live', status: 'Live', docUrl: '#', description: 'Check pending challans for a vehicle' },
  { id: 'veh-3', name: 'Fastag Details API', category: 'Vehicle Verification Live', status: 'Live', docUrl: '#', description: 'Fetch Fastag linked vehicle details' },

  // Profession Check
  { id: 'prof-1', name: 'CA Membership Verification API', category: 'Profession Check', status: 'Live', docUrl: '#', description: 'Verify Chartered Accountant membership' },
  { id: 'prof-2', name: 'Doctor Registration Check API', category: 'Profession Check', status: 'Live', docUrl: '#', description: 'Verify NMC/SMC doctor registration' },
  { id: 'prof-3', name: 'Advocate Bar Council Check API', category: 'Profession Check', status: 'Discontinued', docUrl: '#', description: 'Verify advocate registration with Bar Council' },

  // Miscellaneous
  { id: 'misc-1', name: 'Ration Card Verification API', category: 'Miscellaneous', status: 'Live', docUrl: '#', description: 'Verify ration card details' },
  { id: 'misc-2', name: 'Court Case Search API', category: 'Miscellaneous', status: 'Live', docUrl: '#', description: 'Search court case records by name/ID' },
  { id: 'misc-3', name: 'Property Registration Check API', category: 'Miscellaneous', status: 'Live', docUrl: '#', description: 'Verify property registration details' },

  // Tampering Check
  { id: 'tamp-1', name: 'Document Tampering Detection API', category: 'Tampering Check', status: 'Live', docUrl: '#', description: 'Detect tampering in uploaded documents' },
  { id: 'tamp-2', name: 'Image Forensics API', category: 'Tampering Check', status: 'Live', docUrl: '#', description: 'Detect image manipulation and forgery' },
  { id: 'tamp-3', name: 'QR Code Authenticity API', category: 'Tampering Check', status: 'Live', docUrl: '#', description: 'Verify authenticity of QR codes on documents' },
];

const CATEGORY_ICONS: Record<string, string> = {
  KYC: '🛡️',
  KYB: '🏢',
  'Mobile Number Lookup': '📱',
  'Digital Footprint': '🌐',
  Utility: '🔧',
  'Fraud Check': '🚨',
  'Financial Check': '📊',
  'Vehicle Verification Live': '🚗',
  'Profession Check': '👨‍⚕️',
  Miscellaneous: '📋',
  'Tampering Check': '🔍',
};

const CATEGORY_ORDER = [
  'KYC', 'KYB', 'Mobile Number Lookup', 'Digital Footprint', 'Utility',
  'Fraud Check', 'Financial Check', 'Vehicle Verification Live',
  'Profession Check', 'Miscellaneous', 'Tampering Check',
];

export function APIDocsTab() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return API_DOCS;
    const q = search.toLowerCase();
    return API_DOCS.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, APIDoc[]>();
    filtered.forEach(api => {
      const existing = map.get(api.category) || [];
      existing.push(api);
      map.set(api.category, existing);
    });
    return CATEGORY_ORDER
      .filter(cat => map.has(cat))
      .map(cat => [cat, map.get(cat)!] as [string, APIDoc[]]);
  }, [filtered]);

  const totalLive = filtered.filter(a => a.status === 'Live').length;
  const totalDiscontinued = filtered.filter(a => a.status === 'Discontinued').length;

  return (
    <div className="space-y-4">
      {/* Summary + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1">
            {filtered.length} APIs
          </Badge>
          <Badge className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
            {totalLive} Live
          </Badge>
          <Badge variant="destructive" className="text-xs px-3 py-1 opacity-80">
            {totalDiscontinued} Discontinued
          </Badge>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs by name, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Categories — always open */}
      <div className="space-y-3">
        {grouped.map(([category, apis]) => {
          const liveCount = apis.filter(a => a.status === 'Live').length;

          return (
            <Card key={category} className="glass-card overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[category] || '📄'}</span>
                  <div>
                    <p className="font-semibold text-sm">{category}</p>
                    <p className="text-xs text-muted-foreground">
                      {apis.length} APIs · {liveCount} Live
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_140px] gap-2 px-4 py-2 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>API Name</span>
                <span className="text-center">Status</span>
                <span className="text-center">Documentation</span>
              </div>

              {/* Table rows */}
              {apis.map((api, idx) => (
                <div
                  key={api.id}
                  className={cn(
                    'grid grid-cols-[1fr_100px_140px] gap-2 px-4 py-3 items-center text-sm transition-colors hover:bg-muted/20',
                    idx < apis.length - 1 && 'border-b border-border/50'
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">{api.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{api.description}</p>
                  </div>
                  <div className="flex justify-center">
                    <Badge
                      variant={api.status === 'Live' ? 'default' : 'destructive'}
                      className={cn(
                        'text-[10px] px-2',
                        api.status === 'Live' && 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25'
                      )}
                    >
                      {api.status === 'Live' ? '● Live' : '● Discontinued'}
                    </Badge>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary" asChild>
                      <a href={api.docUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" asChild>
                      <a href={api.docUrl} download>
                        <Download className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          );
        })}

        {grouped.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No APIs found matching "{search}"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

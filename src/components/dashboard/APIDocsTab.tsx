import { useState, useMemo } from 'react';
import { Search, FileText, Download, ExternalLink, ChevronDown, ChevronRight, ShieldAlert, Share2, History, Mail, Send, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface APIDoc {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  sensitive?: boolean;
  docUrl: string;
  description: string;
}

interface ShareRecord {
  id: string;
  apiNames: string[];
  sharedTo: string[];
  cc: string;
  reason: string;
  sharedBy: string;
  sharedAt: string;
  count: number;
}

const ADMIN_EMAIL = 'admin@befisc.com';
const CURRENT_USER = 'analyst@befisc.com';

const API_DOCS: APIDoc[] = [
  // Aadhaar APIs
  { id: 'aad-1', name: 'Aadhaar Verification API', category: 'Aadhaar APIs', subcategory: 'Identity Verification', sensitive: true, docUrl: '#', description: 'Aadhaar-based identity verification' },
  { id: 'aad-2', name: 'Aadhaar OTP Validation API', category: 'Aadhaar APIs', subcategory: 'OTP & Authentication', sensitive: true, docUrl: '#', description: 'Validate Aadhaar via OTP' },
  { id: 'aad-3', name: 'Mobile to Aadhaar Link Check API', category: 'Aadhaar APIs', subcategory: 'Linkage Checks', sensitive: true, docUrl: '#', description: 'Check Aadhaar linkage with mobile number' },
  { id: 'aad-4', name: 'Face Match API', category: 'Aadhaar APIs', subcategory: 'Biometric & Face Match', sensitive: true, docUrl: '#', description: 'AI-powered face comparison and liveness' },

  // PAN APIs
  { id: 'pan-1', name: 'PAN Verification API', category: 'PAN APIs', subcategory: 'Verification', sensitive: true, docUrl: '#', description: 'Verify PAN card details in real-time' },
  { id: 'pan-2', name: 'PAN to Aadhaar Link API', category: 'PAN APIs', subcategory: 'Linkage Checks', sensitive: true, docUrl: '#', description: 'Check PAN-Aadhaar linkage status' },
  { id: 'pan-3', name: 'PAN 360° Profile API', category: 'PAN APIs', subcategory: 'Profile & Insights', sensitive: true, docUrl: '#', description: 'Comprehensive PAN holder profile' },

  // Government ID APIs
  { id: 'gov-1', name: 'Voter ID Verification API', category: 'Government ID APIs', subcategory: 'Voter ID', docUrl: '#', description: 'Verify Voter ID card details' },
  { id: 'gov-2', name: 'Driving License Verification API', category: 'Government ID APIs', subcategory: 'Driving License', docUrl: '#', description: 'DL number verification and details fetch' },
  { id: 'gov-3', name: 'Ration Card Verification API', category: 'Government ID APIs', subcategory: 'Ration Card', docUrl: '#', description: 'Verify ration card details' },

  // KYB
  { id: 'kyb-1', name: 'GST Verification API', category: 'KYB', subcategory: 'GST', docUrl: '#', description: 'Verify GSTIN and fetch business details' },
  { id: 'kyb-2', name: 'MCA Company Search API', category: 'KYB', subcategory: 'Company & Corporate', docUrl: '#', description: 'Search and verify company details from MCA' },
  { id: 'kyb-3', name: 'FSSAI License Verification API', category: 'KYB', subcategory: 'Licenses & Registrations', docUrl: '#', description: 'Verify FSSAI license details' },
  { id: 'kyb-4', name: 'UDYAM Registration API', category: 'KYB', subcategory: 'Licenses & Registrations', docUrl: '#', description: 'Verify MSME Udyam registration' },

  // Mobile Number Lookup
  { id: 'mob-1', name: 'Mobile Number to Name API', category: 'Mobile Number Lookup', subcategory: 'Identity Lookup', sensitive: true, docUrl: '#', description: 'Fetch name associated with a mobile number' },
  { id: 'mob-2', name: 'Mobile Number Verification API', category: 'Mobile Number Lookup', subcategory: 'Verification', docUrl: '#', description: 'Verify if a mobile number is active' },

  // Digital Footprint
  { id: 'df-1', name: 'Email Risk Score API', category: 'Digital Footprint', subcategory: 'Email Intelligence', docUrl: '#', description: 'Assess risk score for email addresses' },
  { id: 'df-2', name: 'Social Media Lookup API', category: 'Digital Footprint', subcategory: 'Social Profile Lookup', sensitive: true, docUrl: '#', description: 'Lookup social media profiles from identifiers' },

  // Utility
  { id: 'util-1', name: 'IFSC Code Lookup API', category: 'Utility', subcategory: 'Banking Utilities', docUrl: '#', description: 'Fetch bank branch details by IFSC code' },
  { id: 'util-2', name: 'Pincode Lookup API', category: 'Utility', subcategory: 'Location Utilities', docUrl: '#', description: 'Get location details from pincode' },
  { id: 'util-3', name: 'Email Verification API', category: 'Utility', subcategory: 'Communication', docUrl: '#', description: 'Validate email address deliverability' },
  { id: 'util-4', name: 'OCR Document Parser API', category: 'Utility', subcategory: 'Document Processing', docUrl: '#', description: 'Extract text and data from documents' },

  // Fraud Check
  { id: 'fraud-1', name: 'Bank Account Fraud Check API', category: 'Fraud Check', subcategory: 'Account Fraud', sensitive: true, docUrl: '#', description: 'Detect fraudulent bank accounts' },
  { id: 'fraud-2', name: 'Device Fingerprint API', category: 'Fraud Check', subcategory: 'Device Intelligence', docUrl: '#', description: 'Identify devices for fraud prevention' },
  { id: 'fraud-3', name: 'IP Risk Assessment API', category: 'Fraud Check', subcategory: 'Network & IP Risk', docUrl: '#', description: 'Assess risk based on IP address' },

  // Financial Check
  { id: 'fin-1', name: 'CIBIL Score Fetch API', category: 'Financial Check', subcategory: 'Credit Bureau', sensitive: true, docUrl: '#', description: 'Fetch consumer credit score and report' },
  { id: 'fin-2', name: 'CRIF Report API', category: 'Financial Check', subcategory: 'Credit Bureau', sensitive: true, docUrl: '#', description: 'Fetch CRIF credit report' },
  { id: 'fin-3', name: 'Bank Statement Analysis API', category: 'Financial Check', subcategory: 'Banking Insights', sensitive: true, docUrl: '#', description: 'Parse and analyze bank statements' },
  { id: 'fin-4', name: 'ITR Verification API', category: 'Financial Check', subcategory: 'Tax & Income', sensitive: true, docUrl: '#', description: 'Fetch and verify income tax returns' },

  // Vehicle Verification Live
  { id: 'veh-1', name: 'RC Verification API', category: 'Vehicle Verification Live', subcategory: 'Registration', docUrl: '#', description: 'Verify vehicle registration certificate' },
  { id: 'veh-2', name: 'Challan Check API', category: 'Vehicle Verification Live', subcategory: 'Compliance & Challans', docUrl: '#', description: 'Check pending challans for a vehicle' },
  { id: 'veh-3', name: 'Fastag Details API', category: 'Vehicle Verification Live', subcategory: 'Tolls & Fastag', docUrl: '#', description: 'Fetch Fastag linked vehicle details' },

  // Profession Check
  { id: 'prof-1', name: 'CA Membership Verification API', category: 'Profession Check', subcategory: 'Finance Professionals', docUrl: '#', description: 'Verify Chartered Accountant membership' },
  { id: 'prof-2', name: 'Doctor Registration Check API', category: 'Profession Check', subcategory: 'Medical Professionals', docUrl: '#', description: 'Verify NMC/SMC doctor registration' },

  // Miscellaneous
  { id: 'misc-1', name: 'Court Case Search API', category: 'Miscellaneous', subcategory: 'Legal Records', sensitive: true, docUrl: '#', description: 'Search court case records by name/ID' },
  { id: 'misc-2', name: 'Property Registration Check API', category: 'Miscellaneous', subcategory: 'Property Records', docUrl: '#', description: 'Verify property registration details' },

  // Tampering Check
  { id: 'tamp-1', name: 'Document Tampering Detection API', category: 'Tampering Check', subcategory: 'Document Forensics', docUrl: '#', description: 'Detect tampering in uploaded documents' },
  { id: 'tamp-2', name: 'Image Forensics API', category: 'Tampering Check', subcategory: 'Image Forensics', docUrl: '#', description: 'Detect image manipulation and forgery' },
  { id: 'tamp-3', name: 'QR Code Authenticity API', category: 'Tampering Check', subcategory: 'QR & Barcode', docUrl: '#', description: 'Verify authenticity of QR codes on documents' },
];

const CATEGORY_ICONS: Record<string, string> = {
  'Aadhaar APIs': '🆔',
  'PAN APIs': '💳',
  'Government ID APIs': '🪪',
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
  'Aadhaar APIs', 'PAN APIs', 'Government ID APIs', 'KYB',
  'Mobile Number Lookup', 'Digital Footprint', 'Utility',
  'Fraud Check', 'Financial Check', 'Vehicle Verification Live',
  'Profession Check', 'Miscellaneous', 'Tampering Check',
];

// Mock initial share history
const INITIAL_SHARE_HISTORY: ShareRecord[] = [
  {
    id: 's1',
    apiNames: ['PAN Verification API', 'Aadhaar Verification API'],
    sharedTo: ['partner@acme.com'],
    cc: ADMIN_EMAIL,
    reason: 'Onboarding documentation for new client integration',
    sharedBy: 'analyst@befisc.com',
    sharedAt: '2025-04-12 14:23',
    count: 3,
  },
  {
    id: 's2',
    apiNames: ['GST Verification API'],
    sharedTo: ['devteam@fintech.io'],
    cc: ADMIN_EMAIL,
    reason: 'Technical evaluation',
    sharedBy: 'analyst@befisc.com',
    sharedAt: '2025-04-10 09:15',
    count: 1,
  },
];

export function APIDocsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [viewingDoc, setViewingDoc] = useState<APIDoc | null>(null);
  const [pendingSensitive, setPendingSensitive] = useState<APIDoc | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareHistory, setShareHistory] = useState<ShareRecord[]>(INITIAL_SHARE_HISTORY);
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());

  const toggleSubcategory = (key: string) => {
    setCollapsedSubs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Share form state
  const [selectedApiIds, setSelectedApiIds] = useState<Set<string>>(new Set());
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [shareSearch, setShareSearch] = useState('');
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');

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

  const handleViewClick = (api: APIDoc) => {
    setViewingDoc(api);
  };

  const selectedSensitiveApis = useMemo(
    () => API_DOCS.filter(a => selectedApiIds.has(a.id) && a.sensitive),
    [selectedApiIds]
  );

  const confirmSensitiveShare = () => {
    setPendingSensitive(null);
    setConfirmShareOpen(true);
  };

  const toggleApiSelection = (id: string) => {
    setSelectedApiIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetShareForm = () => {
    setSelectedApiIds(new Set());
    setRecipientEmails([]);
    setRecipientInput('');
    setEmailSubject('');
    setEmailBody('');
    setShareSearch('');
  };

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const commitRecipientInput = () => {
    const raw = recipientInput.trim().replace(/[,;]+$/, '');
    if (!raw) return true;
    const parts = raw.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean);
    const invalid = parts.filter(p => !isValidEmail(p));
    if (invalid.length) {
      toast({ title: 'Invalid email', description: `${invalid.join(', ')} is not a valid email.`, variant: 'destructive' });
      return false;
    }
    setRecipientEmails(prev => Array.from(new Set([...prev, ...parts])));
    setRecipientInput('');
    return true;
  };

  const removeRecipient = (email: string) => {
    setRecipientEmails(prev => prev.filter(e => e !== email));
  };

  const handleShareSubmit = () => {
    if (selectedApiIds.size === 0) {
      toast({ title: 'No APIs selected', description: 'Please select at least one API to share.', variant: 'destructive' });
      return;
    }
    // Commit any pending text in the recipient input
    if (!commitRecipientInput()) return;
    const allRecipients = recipientInput.trim()
      ? Array.from(new Set([...recipientEmails, ...recipientInput.trim().split(/[\s,;]+/).filter(Boolean)]))
      : recipientEmails;
    if (allRecipients.length === 0) {
      toast({ title: 'Recipient required', description: 'Please add at least one recipient email.', variant: 'destructive' });
      return;
    }
    if (!emailSubject.trim()) {
      toast({ title: 'Subject required', description: 'Please enter an email subject.', variant: 'destructive' });
      return;
    }

    // If any selected APIs are sensitive, ask for confirmation first
    const firstSensitive = API_DOCS.find(a => selectedApiIds.has(a.id) && a.sensitive);
    if (firstSensitive) {
      setPendingSensitive(firstSensitive);
      return;
    }

    setConfirmShareOpen(true);
  };

  const performShare = () => {
    const apiNames = API_DOCS.filter(a => selectedApiIds.has(a.id)).map(a => a.name);
    const recipients = recipientEmails;
    const recipientsKey = [...recipients].sort().join(',');

    const existingIdx = shareHistory.findIndex(
      r => [...r.sharedTo].sort().join(',') === recipientsKey
    );
    if (existingIdx >= 0) {
      const updated = [...shareHistory];
      updated[existingIdx] = {
        ...updated[existingIdx],
        count: updated[existingIdx].count + 1,
        apiNames,
        reason: emailBody || updated[existingIdx].reason,
        sharedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      setShareHistory(updated);
    } else {
      setShareHistory(prev => [
        {
          id: `s${Date.now()}`,
          apiNames,
          sharedTo: recipients,
          cc: ADMIN_EMAIL,
          reason: emailBody,
          sharedBy: CURRENT_USER,
          sharedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          count: 1,
        },
        ...prev,
      ]);
    }

    toast({
      title: 'Documentation shared',
      description: `Sent ${apiNames.length} API doc(s) to ${recipients.join(', ')} (CC: ${ADMIN_EMAIL})`,
    });
    setConfirmShareOpen(false);
    setShareOpen(false);
    resetShareForm();
  };

  return (
    <div className="space-y-4">
      {/* Summary + Search + Share */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className="text-xs px-3 py-1">
            {filtered.length} APIs
          </Badge>
          <Badge className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
            All Live
          </Badge>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search APIs by name, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Categories — always open */}
      <div className="space-y-3">
        {grouped.map(([category, apis]) => {
          return (
            <Card key={category} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[category] || '📄'}</span>
                  <div>
                    <p className="font-semibold text-sm">{category}</p>
                    <p className="text-xs text-muted-foreground">
                      {apis.length} APIs
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-[1fr_140px] gap-2 px-4 py-2 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>API Name</span>
                <span className="text-center">Documentation</span>
              </div>

              {apis.map((api, idx) => (
                <div
                  key={api.id}
                  className={cn(
                    'grid grid-cols-[1fr_140px] gap-2 px-4 py-3 items-center text-sm transition-colors hover:bg-muted/20',
                    idx < apis.length - 1 && 'border-b border-border/50'
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">{api.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{api.description}</p>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-primary"
                      onClick={() => handleViewClick(api)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
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

      {/* Sensitive API Share Confirmation Dialog */}
      <Dialog open={!!pendingSensitive} onOpenChange={(open) => !open && setPendingSensitive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <DialogTitle>Sensitive API in Selection</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              {selectedSensitiveApis.length === 1 ? (
                <>
                  <span className="font-medium text-foreground">{selectedSensitiveApis[0]?.name}</span> is a sensitive API and requires permission to share. Do you want to proceed?
                </>
              ) : (
                <>
                  Your selection includes <span className="font-medium text-foreground">{selectedSensitiveApis.length} sensitive APIs</span> that require permission to share. Do you want to proceed?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPendingSensitive(null)}>
              No
            </Button>
            <Button onClick={confirmSensitiveShare} className="bg-amber-500 hover:bg-amber-600 text-white">
              Yes, proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doc Viewer Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">{viewingDoc?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{viewingDoc?.description}</p>
              </div>
              <div className="flex items-center gap-2 mr-8">
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                  <a href={viewingDoc?.docUrl} download>
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-muted/30 rounded-lg border border-border p-8 h-full flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">API Documentation</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Documentation for <span className="font-medium">{viewingDoc?.name}</span> will be displayed here once document URLs are configured.
              </p>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs" asChild>
                <a href={viewingDoc?.docUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  Open in new tab
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={(open) => { setShareOpen(open); if (!open) resetShareForm(); }}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share API Documentation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send selected API docs to a recipient. Admin is automatically added in CC.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="share" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-3">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="share" className="text-xs gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Share
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs gap-1.5">
                  <History className="w-3.5 h-3.5" /> History (Admin)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="share" className="flex-1 overflow-hidden flex flex-col mt-3 px-6 pb-6 data-[state=inactive]:hidden">
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">
                    Select APIs ({selectedApiIds.size} selected)
                  </Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search APIs..."
                      value={shareSearch}
                      onChange={e => setShareSearch(e.target.value)}
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <ScrollArea className="h-[210px] border border-border rounded-md p-2">
                    {(() => {
                      const q = shareSearch.trim().toLowerCase();
                      const matches = (a: APIDoc) =>
                        !q ||
                        a.name.toLowerCase().includes(q) ||
                        a.category.toLowerCase().includes(q) ||
                        (a.subcategory?.toLowerCase().includes(q) ?? false) ||
                        a.description.toLowerCase().includes(q);
                      const cats = CATEGORY_ORDER.filter(c =>
                        API_DOCS.some(a => a.category === c && matches(a))
                      );
                      if (cats.length === 0) {
                        return (
                          <p className="text-xs text-muted-foreground text-center py-6">
                            No APIs match "{shareSearch}"
                          </p>
                        );
                      }
                      return cats.map(cat => (
                        <div key={cat} className="mb-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            {cat}
                          </p>
                          {API_DOCS.filter(a => a.category === cat && matches(a)).map(api => (
                            <label
                              key={api.id}
                              className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/40 rounded cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedApiIds.has(api.id)}
                                onCheckedChange={() => toggleApiSelection(api.id)}
                              />
                              <span className="text-sm flex-1">{api.name}</span>
                              {api.sensitive && (
                                <ShieldAlert className="w-3 h-3 text-amber-500" />
                              )}
                            </label>
                          ))}
                        </div>
                      ));
                    })()}
                  </ScrollArea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="recipient" className="text-xs font-medium mb-1.5 block">
                      Recipient Emails <span className="text-destructive">*</span>
                    </Label>
                    <div className="min-h-9 px-2 py-1 rounded-md border border-input bg-background flex flex-wrap items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                      {recipientEmails.map(email => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="text-xs h-6 pl-2 pr-1 gap-1 font-normal"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeRecipient(email)}
                            className="hover:bg-muted-foreground/20 rounded-sm p-0.5"
                            aria-label={`Remove ${email}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        id="recipient"
                        type="email"
                        placeholder={recipientEmails.length ? 'Add another...' : 'recipient@example.com'}
                        value={recipientInput}
                        onChange={e => setRecipientInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
                            if (recipientInput.trim()) {
                              e.preventDefault();
                              commitRecipientInput();
                            }
                          } else if (e.key === 'Backspace' && !recipientInput && recipientEmails.length) {
                            removeRecipient(recipientEmails[recipientEmails.length - 1]);
                          }
                        }}
                        onBlur={() => commitRecipientInput()}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm h-7 px-1"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Press Enter, comma, or semicolon to add multiple emails.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">CC (auto)</Label>
                    <div className="h-9 px-3 rounded-md border border-border bg-muted/40 flex items-center text-sm text-muted-foreground gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {ADMIN_EMAIL}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="emailSubject" className="text-xs font-medium mb-1.5 block">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="emailSubject"
                    placeholder="API Documentation as requested"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="emailBody" className="text-xs font-medium mb-1.5 block">
                    Email body
                  </Label>
                  <Textarea
                    id="emailBody"
                    placeholder={"Hi Rajesh,\n\nPlease find the APIs doc as requested."}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="text-sm min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-3">
                <Button variant="outline" onClick={() => { setShareOpen(false); resetShareForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleShareSubmit} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Share Documentation
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden mt-3 px-6 pb-6 data-[state=inactive]:hidden flex flex-col">
              {(() => {
                const uniqueRecipients = Array.from(
                  new Set(shareHistory.flatMap(r => r.sharedTo))
                ).sort();
                const q = historyFilter.trim().toLowerCase();
                const filteredHistory = q
                  ? shareHistory.filter(r =>
                      r.sharedTo.some(e => e.toLowerCase().includes(q)) ||
                      r.sharedBy.toLowerCase().includes(q)
                    )
                  : shareHistory;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Filter by recipient or sender email..."
                          value={historyFilter}
                          onChange={e => setHistoryFilter(e.target.value)}
                          className="h-8 text-xs pl-8 pr-8"
                          list="history-recipients"
                        />
                        <datalist id="history-recipients">
                          {uniqueRecipients.map(e => (
                            <option key={e} value={e} />
                          ))}
                        </datalist>
                        {historyFilter && (
                          <button
                            type="button"
                            onClick={() => setHistoryFilter('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Clear filter"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] h-7 px-2">
                        {filteredHistory.length} / {shareHistory.length}
                      </Badge>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-3">
                        {filteredHistory.length === 0 && (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            {shareHistory.length === 0 ? 'No share history yet.' : `No history matches "${historyFilter}".`}
                          </div>
                        )}
                        {filteredHistory.map(record => (
                          <Card key={record.id} className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                                  {record.sharedTo.map(email => (
                                    <Badge
                                      key={email}
                                      variant="secondary"
                                      className="text-[11px] px-1.5 py-0 h-5 font-normal"
                                    >
                                      {email}
                                    </Badge>
                                  ))}
                                  <Badge variant="secondary" className="text-[10px] px-1.5 h-4 shrink-0">
                                    {record.count}× shared
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  CC: {record.cc} · By {record.sharedBy} · {record.sharedAt}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {record.apiNames.map(name => (
                                <Badge key={name} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                            {record.reason && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                                "{record.reason}"
                              </p>
                            )}
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Final Share Confirmation Dialog */}
      <Dialog open={confirmShareOpen} onOpenChange={setConfirmShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Confirm Share
            </DialogTitle>
            <DialogDescription className="text-xs">
              Please review the details before sending the API documentation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-[90px_1fr] gap-y-2 gap-x-3 text-sm">
              <span className="text-muted-foreground">Recipients</span>
              <div className="flex flex-wrap gap-1">
                {recipientEmails.map(e => (
                  <Badge key={e} variant="secondary" className="text-[11px] font-normal">{e}</Badge>
                ))}
              </div>

              <span className="text-muted-foreground">CC</span>
              <span className="font-medium break-all">{ADMIN_EMAIL}</span>

              <span className="text-muted-foreground">Subject</span>
              <span className="font-medium break-words">{emailSubject}</span>

              <span className="text-muted-foreground">APIs</span>
              <span className="font-medium">{selectedApiIds.size} selected</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={performShare} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

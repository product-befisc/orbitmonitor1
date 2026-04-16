import { useState, useMemo } from 'react';
import { Search, FileText, Download, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

  // Utilities
  { id: 'util-1', name: 'IFSC Code Lookup API', category: 'Utilities', status: 'Live', docUrl: '#', description: 'Fetch bank branch details by IFSC code' },
  { id: 'util-2', name: 'Pincode Lookup API', category: 'Utilities', status: 'Live', docUrl: '#', description: 'Get location details from pincode' },
  { id: 'util-3', name: 'Email Verification API', category: 'Utilities', status: 'Live', docUrl: '#', description: 'Validate email address deliverability' },
  { id: 'util-4', name: 'Phone Number Validation API', category: 'Utilities', status: 'Discontinued', docUrl: '#', description: 'Validate and identify phone numbers' },
  { id: 'util-5', name: 'OCR Document Parser API', category: 'Utilities', status: 'Live', docUrl: '#', description: 'Extract text and data from documents' },

  // Banking
  { id: 'bank-1', name: 'Bank Account Verification API', category: 'Banking', status: 'Live', docUrl: '#', description: 'Penny-drop based account verification' },
  { id: 'bank-2', name: 'Bank Statement Analysis API', category: 'Banking', status: 'Live', docUrl: '#', description: 'Parse and analyze bank statements' },
  { id: 'bank-3', name: 'NACH/eMandate API', category: 'Banking', status: 'Live', docUrl: '#', description: 'Automate recurring payment mandates' },
  { id: 'bank-4', name: 'UPI Verification API', category: 'Banking', status: 'Live', docUrl: '#', description: 'Verify UPI VPA and linked account' },

  // Credit
  { id: 'credit-1', name: 'CIBIL Score Fetch API', category: 'Credit', status: 'Live', docUrl: '#', description: 'Fetch consumer credit score and report' },
  { id: 'credit-2', name: 'CRIF Report API', category: 'Credit', status: 'Live', docUrl: '#', description: 'Fetch CRIF credit report' },
  { id: 'credit-3', name: 'Equifax Report API', category: 'Credit', status: 'Discontinued', docUrl: '#', description: 'Fetch Equifax credit report' },

  // Employment
  { id: 'emp-1', name: 'EPFO Verification API', category: 'Employment', status: 'Live', docUrl: '#', description: 'Verify employment via EPFO/UAN' },
  { id: 'emp-2', name: 'ITR Verification API', category: 'Employment', status: 'Live', docUrl: '#', description: 'Fetch and verify income tax returns' },
  { id: 'emp-3', name: 'Form 26AS API', category: 'Employment', status: 'Live', docUrl: '#', description: 'Fetch Form 26AS tax credit statement' },
];

const CATEGORY_ICONS: Record<string, string> = {
  KYC: '🛡️',
  KYB: '🏢',
  Utilities: '🔧',
  Banking: '🏦',
  Credit: '📊',
  Employment: '💼',
};

export function APIDocsTab() {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

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
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

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

      {/* Categories */}
      <div className="space-y-2">
        {grouped.map(([category, apis]) => {
          const isOpen = openCategories.has(category);
          const liveCount = apis.filter(a => a.status === 'Live').length;

          return (
            <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
              <Card className="glass-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{CATEGORY_ICONS[category] || '📄'}</span>
                      <div>
                        <p className="font-semibold text-sm">{category}</p>
                        <p className="text-xs text-muted-foreground">
                          {apis.length} APIs · {liveCount} Live
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_100px_140px] gap-2 px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
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

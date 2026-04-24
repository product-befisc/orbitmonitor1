import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  FileText,
  Send,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type PricingType = 'flat' | 'success' | 'per_doc';

export interface CommercialAPI {
  id: string;
  name: string;
  category: string;
}

export interface SlabDef {
  id: string;
  label: string;
}

export interface APIRow {
  apiId: string;
  pricingType: PricingType;
  // For flat: single price per slab
  // For success: { success, noRecord } per slab
  // For per_doc: single price per slab (per document)
  slabs: Record<string, { primary: number; secondary?: number }>;
}

export interface CommercialData {
  clientName: string;
  proposalDate: Date;
  validityDays: number;
  oneTimeCredit: number;
  amcFees: number;
  amcWaived: boolean;
  minMonthly: number;
  minMonthlyWaived: boolean;
  slabs: SlabDef[];
  rows: Record<string, APIRow>; // keyed by apiId
  notes: string;
}

const DEFAULT_NOTES = `1. All prices are quoted in INR (₹) and are exclusive of applicable GST.
2. Pricing is valid for the duration mentioned in proposal validity from the date of issue.
3. Invoicing will be done on a monthly basis. Payment terms: NET 15 days from invoice date.
4. The minimum monthly commitment, if applicable, is billed regardless of actual usage.
5. Slab pricing is calculated on cumulative monthly hits per API.
6. Befisc reserves the right to revise pricing with a 30-day prior written notice.
7. Service Level Agreements (SLAs) are governed by the Master Service Agreement.`;

const DEFAULT_SLABS: SlabDef[] = [
  { id: 'slab-1', label: 'Upto 1L Hits' },
  { id: 'slab-2', label: '1L – 5L Hits' },
  { id: 'slab-3', label: '5L+ Hits' },
];

const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  flat: 'Flat',
  success: 'Success-based',
  per_doc: 'Per Document',
};

interface CommercialBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apis: CommercialAPI[];
  initialClientName?: string;
  onShare: (data: CommercialData) => void;
}

export function CommercialBuilder({
  open,
  onOpenChange,
  apis,
  initialClientName = '',
  onShare,
}: CommercialBuilderProps) {
  const [clientName, setClientName] = useState(initialClientName);
  const [proposalDate, setProposalDate] = useState<Date>(new Date());
  const [validityDays, setValidityDays] = useState(30);
  const [oneTimeCredit, setOneTimeCredit] = useState(0);
  const [amcFees, setAmcFees] = useState(0);
  const [amcWaived, setAmcWaived] = useState(false);
  const [minMonthly, setMinMonthly] = useState(0);
  const [minMonthlyWaived, setMinMonthlyWaived] = useState(false);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [slabs, setSlabs] = useState<SlabDef[]>(DEFAULT_SLABS);
  const [rows, setRows] = useState<Record<string, APIRow>>({});
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Initialize/sync rows when APIs or slabs change
  useEffect(() => {
    setRows(prev => {
      const next: Record<string, APIRow> = {};
      apis.forEach(api => {
        const existing = prev[api.id];
        const slabMap: Record<string, { primary: number; secondary?: number }> = {};
        slabs.forEach(s => {
          slabMap[s.id] = existing?.slabs[s.id] ?? { primary: 0 };
        });
        next[api.id] = {
          apiId: api.id,
          pricingType: existing?.pricingType ?? 'flat',
          slabs: slabMap,
        };
      });
      return next;
    });
  }, [apis, slabs]);

  // Reset client name when reopened
  useEffect(() => {
    if (open && initialClientName) setClientName(initialClientName);
  }, [open, initialClientName]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommercialAPI[]>();
    apis.forEach(api => {
      const list = map.get(api.category) || [];
      list.push(api);
      map.set(api.category, list);
    });
    return Array.from(map.entries());
  }, [apis]);

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const addSlab = () => {
    const id = `slab-${Date.now()}`;
    setSlabs(prev => [...prev, { id, label: `Slab ${prev.length + 1}` }]);
  };

  const removeSlab = (id: string) => {
    if (slabs.length <= 1) return;
    setSlabs(prev => prev.filter(s => s.id !== id));
  };

  const renameSlab = (id: string, label: string) => {
    setSlabs(prev => prev.map(s => (s.id === id ? { ...s, label } : s)));
  };

  const updateRow = (apiId: string, patch: Partial<APIRow>) => {
    setRows(prev => ({ ...prev, [apiId]: { ...prev[apiId], ...patch } }));
  };

  const updatePrice = (
    apiId: string,
    slabId: string,
    field: 'primary' | 'secondary',
    value: number,
  ) => {
    setRows(prev => ({
      ...prev,
      [apiId]: {
        ...prev[apiId],
        slabs: {
          ...prev[apiId].slabs,
          [slabId]: { ...prev[apiId].slabs[slabId], [field]: value },
        },
      },
    }));
  };

  const applyToCategory = (category: string, sourceApiId: string) => {
    const source = rows[sourceApiId];
    if (!source) return;
    const apisInCat = apis.filter(a => a.category === category);
    setRows(prev => {
      const next = { ...prev };
      apisInCat.forEach(api => {
        next[api.id] = {
          apiId: api.id,
          pricingType: source.pricingType,
          slabs: JSON.parse(JSON.stringify(source.slabs)),
        };
      });
      return next;
    });
  };

  const handleShare = () => {
    onShare({
      clientName,
      proposalDate,
      validityDays,
      oneTimeCredit,
      amcFees,
      amcWaived,
      minMonthly,
      minMonthlyWaived,
      slabs,
      rows,
      notes,
    });
  };

  const validUntil = useMemo(() => {
    const d = new Date(proposalDate);
    d.setDate(d.getDate() + (validityDays || 0));
    return d;
  }, [proposalDate, validityDays]);

  const fmtINR = (n: number) =>
    n > 0 ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] w-[97vw] h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Commercial Builder
            {clientName && (
              <span className="text-sm text-muted-foreground font-normal">— {clientName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr] overflow-hidden">
          {/* LEFT — FORM */}
          <ScrollArea className="border-r border-border">
            <div className="p-6 space-y-6">
              {/* Section 1 */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold tracking-tight">Client & Proposal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Client Name</Label>
                    <Input
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Acme Corporation Pvt Ltd"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Proposal Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-9 w-full justify-start text-left font-normal text-sm',
                            !proposalDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {proposalDate ? format(proposalDate, 'PPP') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={proposalDate}
                          onSelect={d => d && setProposalDate(d)}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Proposal Validity (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={validityDays}
                      onChange={e => setValidityDays(Number(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">One-time Credit (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={oneTimeCredit}
                      onChange={e => setOneTimeCredit(Number(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs">AMC Fees (₹)</Label>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={amcWaived} onCheckedChange={setAmcWaived} className="scale-75" />
                        <span className="text-[10px] text-muted-foreground">Waived</span>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={amcFees}
                      disabled={amcWaived}
                      onChange={e => setAmcFees(Number(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs">Min. Monthly Commitment (₹)</Label>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={minMonthlyWaived} onCheckedChange={setMinMonthlyWaived} className="scale-75" />
                        <span className="text-[10px] text-muted-foreground">Waived</span>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={minMonthly}
                      disabled={minMonthlyWaived}
                      onChange={e => setMinMonthly(Number(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2 — Pricing Table */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">API Pricing</h3>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addSlab}>
                    <Plus className="w-3 h-3" /> Add Slab
                  </Button>
                </div>

                {/* Slab header (editable) */}
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Slabs ({slabs.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slabs.map(slab => (
                      <div key={slab.id} className="flex items-center gap-1 bg-background rounded border border-border px-1.5 py-1">
                        <Input
                          value={slab.label}
                          onChange={e => renameSlab(slab.id, e.target.value)}
                          className="h-6 text-xs w-32 border-0 px-1 focus-visible:ring-1"
                        />
                        {slabs.length > 1 && (
                          <button
                            onClick={() => removeSlab(slab.id)}
                            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {grouped.map(([category, catApis]) => {
                  const collapsed = collapsedCats.has(category);
                  return (
                    <div key={category} className="rounded-md border border-border overflow-hidden">
                      <button
                        onClick={() => toggleCat(category)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {collapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className="text-xs font-semibold">{category}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {catApis.length}
                          </Badge>
                        </div>
                      </button>

                      {!collapsed && (
                        <div className="divide-y divide-border">
                          {catApis.map((api, idx) => {
                            const row = rows[api.id];
                            if (!row) return null;
                            return (
                              <div key={api.id} className="p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{api.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={row.pricingType}
                                      onValueChange={(v: PricingType) =>
                                        updateRow(api.id, { pricingType: v })
                                      }
                                    >
                                      <SelectTrigger className="h-7 text-xs w-[140px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="flat" className="text-xs">Flat</SelectItem>
                                        <SelectItem value="success" className="text-xs">Success-based</SelectItem>
                                        <SelectItem value="per_doc" className="text-xs">Per Document</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {idx === 0 && catApis.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-[11px] text-muted-foreground"
                                        onClick={() => applyToCategory(category, api.id)}
                                        title="Apply this row's pricing to all APIs in this category"
                                      >
                                        <Copy className="w-3 h-3" /> Apply to all
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Price grid per slab */}
                                <div
                                  className="grid gap-2"
                                  style={{ gridTemplateColumns: `repeat(${slabs.length}, minmax(0, 1fr))` }}
                                >
                                  {slabs.map(slab => (
                                    <div key={slab.id} className="space-y-1">
                                      <p className="text-[10px] text-muted-foreground truncate" title={slab.label}>
                                        {slab.label}
                                      </p>
                                      {row.pricingType === 'success' ? (
                                        <div className="space-y-1">
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">S</span>
                                            <Input
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              value={row.slabs[slab.id]?.primary ?? 0}
                                              onChange={e => updatePrice(api.id, slab.id, 'primary', Number(e.target.value) || 0)}
                                              className="h-7 text-xs pl-5"
                                              placeholder="Success ₹"
                                            />
                                          </div>
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">N</span>
                                            <Input
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              value={row.slabs[slab.id]?.secondary ?? 0}
                                              onChange={e => updatePrice(api.id, slab.id, 'secondary', Number(e.target.value) || 0)}
                                              className="h-7 text-xs pl-5"
                                              placeholder="No Record ₹"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                                          <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={row.slabs[slab.id]?.primary ?? 0}
                                            onChange={e => updatePrice(api.id, slab.id, 'primary', Number(e.target.value) || 0)}
                                            className="h-7 text-xs pl-5"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>

              {/* Section 3 — Notes */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold tracking-tight">Notes & Terms</h3>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="text-xs min-h-[140px] font-mono leading-relaxed"
                />
              </section>
            </div>
          </ScrollArea>

          {/* RIGHT — PREVIEW */}
          <ScrollArea className="bg-muted/40">
            <div className="p-6">
              <div className="mx-auto max-w-[640px] bg-background shadow-lg rounded-md overflow-hidden border border-border">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">Befisc · Orbit</p>
                      <h2 className="text-xl font-bold mt-1">Commercial Proposal</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] opacity-80">Date</p>
                      <p className="text-sm font-medium">{format(proposalDate, 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6 text-foreground">
                  {/* Client + meta */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prepared For</p>
                      <p className="text-sm font-semibold mt-0.5">{clientName || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Valid Until</p>
                      <p className="text-sm font-semibold mt-0.5">{format(validUntil, 'dd MMM yyyy')}</p>
                    </div>
                  </div>

                  {/* Commercial summary */}
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="bg-muted/40 px-4 py-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold">Commercial Summary</p>
                    </div>
                    <div className="divide-y divide-border text-xs">
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-muted-foreground">One-time Credit Amount</span>
                        <span className="font-medium">{fmtINR(oneTimeCredit)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-muted-foreground">AMC Fees</span>
                        <span className="font-medium">
                          {amcWaived ? <em className="text-emerald-600 not-italic">Waived Off</em> : fmtINR(amcFees)}
                        </span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-muted-foreground">Minimum Monthly Commitment</span>
                        <span className="font-medium">
                          {minMonthlyWaived ? <em className="text-emerald-600 not-italic">Waived Off</em> : fmtINR(minMonthly)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing tables per category */}
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-wider font-semibold">API Pricing</p>
                    {grouped.map(([category, catApis]) => (
                      <div key={category} className="rounded-md border border-border overflow-hidden">
                        <div className="bg-primary/5 px-3 py-1.5 border-b border-border">
                          <p className="text-[11px] font-semibold">{category}</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="bg-muted/30 text-muted-foreground">
                                <th className="text-left px-3 py-1.5 font-medium">API Name</th>
                                <th className="text-left px-2 py-1.5 font-medium">Type</th>
                                {slabs.map(s => (
                                  <th key={s.id} className="text-right px-2 py-1.5 font-medium">
                                    {s.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {catApis.map(api => {
                                const row = rows[api.id];
                                if (!row) return null;
                                return (
                                  <tr key={api.id}>
                                    <td className="px-3 py-1.5">{api.name}</td>
                                    <td className="px-2 py-1.5 text-muted-foreground">
                                      {PRICING_TYPE_LABELS[row.pricingType]}
                                    </td>
                                    {slabs.map(s => {
                                      const cell = row.slabs[s.id];
                                      return (
                                        <td key={s.id} className="px-2 py-1.5 text-right tabular-nums">
                                          {row.pricingType === 'success' ? (
                                            <div className="space-y-0.5 leading-tight">
                                              <div>{fmtINR(cell?.primary ?? 0)} <span className="text-muted-foreground">/ S</span></div>
                                              <div className="text-muted-foreground">{fmtINR(cell?.secondary ?? 0)} / NRF</div>
                                            </div>
                                          ) : row.pricingType === 'per_doc' ? (
                                            <div>{fmtINR(cell?.primary ?? 0)} <span className="text-muted-foreground">/ doc</span></div>
                                          ) : (
                                            fmtINR(cell?.primary ?? 0)
                                          )}
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
                    ))}
                    {grouped.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">
                        No APIs selected.
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-2">Notes & Terms</p>
                    <pre className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
                      {notes}
                    </pre>
                  </div>

                  <div className="text-center text-[9px] text-muted-foreground pt-4 border-t border-border">
                    Generated by Befisc Orbit · This proposal is confidential.
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-border shrink-0 bg-background">
          <p className="text-[11px] text-muted-foreground">
            Live preview reflects all changes in real time.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Share with Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Plus,
  FileText,
  Send,
  Trash2,
  Save,
  Check,
  ChevronsUpDown,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type PricingType = 'flat' | 'success' | 'per_doc';

export interface CommercialAPI {
  id: string;
  name: string;
  category: string;
}

export interface SlabCell {
  label: string; // e.g. "Upto 1L Hits"
  primary: number; // price (or success price)
  secondary?: number; // no-record-found price for "success" type
}

export interface APIRow {
  apiId: string;
  apiTypeLabel: string; // e.g. "PAN (Supreme) - V2" — editable
  pricingType: PricingType;
  slabs: SlabCell[]; // PER-API slabs
}

export interface ExtraFee {
  id: string;
  /** Free-form text the user types — rendered as-is in the proposal. */
  text: string;
  hidden: boolean;
}

export interface CommercialData {
  serviceProvider: string;
  clientName: string;
  proposalDate: Date;
  validityDays: number;
  walletRecharge: number;
  walletRechargeNote: string;
  walletHidden?: boolean;
  setupFees: number;
  setupFeesWaived: boolean;
  setupFeesHidden?: boolean;
  amcFees: number;
  amcWaived: boolean;
  amcHidden?: boolean;
  minMonthly: number;
  minMonthlyWaived: boolean;
  minMonthlyHidden?: boolean;
  /** User-added extra fee/info lines. */
  extraFees?: ExtraFee[];
  rows: Record<string, APIRow>;
  notes: string;
  /** APIs included in this commercial — persisted so saved commercials retain their API list & categories. */
  apis?: CommercialAPI[];
}

const DEFAULT_NOTES = `a. Kindly read all terms, and conditions and give consent before making payment.
b. Befisc acts as a transporter of information from one source to another with the help of technology solutions. We are tech enablers. We are not responsible or we don't do any data storage until and unless it is as per the regulator's guidelines.
c. It will take 4 hours time to activate the production account once the payment is done.
d. For any payment-related issues please share email to accounts@befisc.com
e. For any technical support, issues send an email to support@befisc.com
f. For any business-related issues send an email to shobhit@befisc.com`;

const DEFAULT_WALLET_NOTE =
  'Post wallet consumption, billing will automatically shift to postpaid, with invoices raised in the following month for that month\u2019s usage.';

const DEFAULT_SLABS = (): SlabCell[] => [
  { label: 'Upto 1L Hits', primary: 0 },
  { label: '1L - 5L Hits', primary: 0 },
  { label: '5L+ Hits', primary: 0 },
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
  /** Full catalog of APIs available for selection inside the builder. */
  availableApis?: CommercialAPI[];
  /** Called when user adds/removes APIs from the inline picker. */
  onApisChange?: (apis: CommercialAPI[]) => void;
  initialClientName?: string;
  /** Existing commercial data to load into the form (edit mode). */
  initialData?: CommercialData;
  /** Existing save name to preload (edit mode). */
  initialSaveName?: string;
  /** Show "Save" button & save-name input. */
  enableSave?: boolean;
  /** Show "Share with Client" button. Defaults to true. */
  enableShare?: boolean;
  /** Label for the primary share button. */
  shareLabel?: string;
  onShare?: (data: CommercialData) => void;
  onSave?: (input: { name: string; data: CommercialData }) => void;
}

export function CommercialBuilder({
  open,
  onOpenChange,
  apis,
  availableApis,
  onApisChange,
  initialClientName = '',
  initialData,
  initialSaveName = '',
  enableSave = false,
  enableShare = true,
  shareLabel = 'Share with Client',
  onShare,
  onSave,
}: CommercialBuilderProps) {
  const [serviceProvider, setServiceProvider] = useState(
    initialData?.serviceProvider ?? 'BEFISC PRIVATE LIMITED',
  );
  const [clientName, setClientName] = useState(initialData?.clientName ?? initialClientName);
  const [proposalDate, setProposalDate] = useState<Date>(initialData?.proposalDate ?? new Date());
  const [validityDays, setValidityDays] = useState(initialData?.validityDays ?? 30);

  const [walletRecharge, setWalletRecharge] = useState(initialData?.walletRecharge ?? 25000);
  const [walletRechargeNote, setWalletRechargeNote] = useState(
    initialData?.walletRechargeNote ?? DEFAULT_WALLET_NOTE,
  );
  const [walletHidden, setWalletHidden] = useState(initialData?.walletHidden ?? false);
  const [setupFees, setSetupFees] = useState(initialData?.setupFees ?? 50000);
  const [setupFeesWaived, setSetupFeesWaived] = useState(initialData?.setupFeesWaived ?? true);
  const [setupFeesHidden, setSetupFeesHidden] = useState(initialData?.setupFeesHidden ?? false);
  const [amcFees, setAmcFees] = useState(initialData?.amcFees ?? 25000);
  const [amcWaived, setAmcWaived] = useState(initialData?.amcWaived ?? true);
  const [amcHidden, setAmcHidden] = useState(initialData?.amcHidden ?? false);
  const [minMonthly, setMinMonthly] = useState(initialData?.minMonthly ?? 50000);
  const [minMonthlyWaived, setMinMonthlyWaived] = useState(initialData?.minMonthlyWaived ?? true);
  const [minMonthlyHidden, setMinMonthlyHidden] = useState(initialData?.minMonthlyHidden ?? false);
  const [extraFees, setExtraFees] = useState<ExtraFee[]>(initialData?.extraFees ?? []);
  const [notes, setNotes] = useState(initialData?.notes ?? DEFAULT_NOTES);
  const [rows, setRows] = useState<Record<string, APIRow>>(initialData?.rows ?? {});
  const [saveName, setSaveName] = useState(initialSaveName);

  // Reset form whenever the dialog opens with a new initialData/save name
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setServiceProvider(initialData.serviceProvider);
      setClientName(initialData.clientName);
      setProposalDate(initialData.proposalDate);
      setValidityDays(initialData.validityDays);
      setWalletRecharge(initialData.walletRecharge);
      setWalletRechargeNote(initialData.walletRechargeNote);
      setWalletHidden(initialData.walletHidden ?? false);
      setSetupFees(initialData.setupFees);
      setSetupFeesWaived(initialData.setupFeesWaived);
      setSetupFeesHidden(initialData.setupFeesHidden ?? false);
      setAmcFees(initialData.amcFees);
      setAmcWaived(initialData.amcWaived);
      setAmcHidden(initialData.amcHidden ?? false);
      setMinMonthly(initialData.minMonthly);
      setMinMonthlyWaived(initialData.minMonthlyWaived);
      setMinMonthlyHidden(initialData.minMonthlyHidden ?? false);
      setExtraFees(initialData.extraFees ?? []);
      setNotes(initialData.notes);
      setRows(initialData.rows);
    }
    setSaveName(initialSaveName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Initialize rows when APIs change — preserve existing edits
  useEffect(() => {
    setRows(prev => {
      const next: Record<string, APIRow> = {};
      apis.forEach(api => {
        next[api.id] =
          prev[api.id] ?? {
            apiId: api.id,
            apiTypeLabel: api.name,
            pricingType: 'flat',
            slabs: DEFAULT_SLABS(),
          };
      });
      return next;
    });
  }, [apis]);

  useEffect(() => {
    if (open && initialClientName && !initialData) setClientName(initialClientName);
  }, [open, initialClientName, initialData]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommercialAPI[]>();
    apis.forEach(api => {
      const list = map.get(api.category) || [];
      list.push(api);
      map.set(api.category, list);
    });
    return Array.from(map.entries());
  }, [apis]);

  const updateRow = (apiId: string, patch: Partial<APIRow>) => {
    setRows(prev => ({ ...prev, [apiId]: { ...prev[apiId], ...patch } }));
  };

  const addSlabToApi = (apiId: string) => {
    setRows(prev => ({
      ...prev,
      [apiId]: {
        ...prev[apiId],
        slabs: [
          ...prev[apiId].slabs,
          { label: `Slab ${prev[apiId].slabs.length + 1}`, primary: 0 },
        ],
      },
    }));
  };

  const removeSlabFromApi = (apiId: string, idx: number) => {
    setRows(prev => {
      const row = prev[apiId];
      if (row.slabs.length <= 1) return prev;
      const slabs = row.slabs.filter((_, i) => i !== idx);
      return { ...prev, [apiId]: { ...row, slabs } };
    });
  };

  const updateSlab = (apiId: string, idx: number, patch: Partial<SlabCell>) => {
    setRows(prev => ({
      ...prev,
      [apiId]: {
        ...prev[apiId],
        slabs: prev[apiId].slabs.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
      },
    }));
  };

  const applySlabsToCategory = (category: string, sourceApiId: string) => {
    const source = rows[sourceApiId];
    if (!source) return;
    setRows(prev => {
      const next = { ...prev };
      apis
        .filter(a => a.category === category)
        .forEach(api => {
          next[api.id] = {
            ...next[api.id],
            pricingType: source.pricingType,
            slabs: source.slabs.map(s => ({ ...s })),
          };
        });
      return next;
    });
  };

  const collectData = (): CommercialData => ({
    serviceProvider,
    clientName,
    proposalDate,
    validityDays,
    walletRecharge,
    walletRechargeNote,
    walletHidden,
    setupFees,
    setupFeesWaived,
    setupFeesHidden,
    amcFees,
    amcWaived,
    amcHidden,
    minMonthly,
    minMonthlyWaived,
    minMonthlyHidden,
    extraFees,
    rows,
    notes,
    apis,
  });

  const addExtraFee = () => {
    setExtraFees(prev => [
      ...prev,
      {
        id: `xf-${Date.now()}`,
        text: '',
        hidden: false,
      },
    ]);
  };

  const updateExtraFee = (id: string, patch: Partial<ExtraFee>) => {
    setExtraFees(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeExtraFee = (id: string) => {
    setExtraFees(prev => prev.filter(f => f.id !== id));
  };

  const handleShare = () => {
    onShare?.(collectData());
  };

  const handleSave = () => {
    onSave?.({ name: saveName.trim() || clientName || 'Untitled commercial', data: collectData() });
  };

  const fmtINR = (n: number) =>
    n > 0 ? `INR ${n.toLocaleString('en-IN')}` : 'INR 0';

  const fmtPrice = (n: number) =>
    n > 0
      ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';

  const proposalYearLabel = useMemo(() => {
    const y = proposalDate.getFullYear();
    return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
  }, [proposalDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1500px] w-[97vw] h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Commercial Builder
            {clientName && (
              <span className="text-sm text-muted-foreground font-normal">— {clientName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_1fr] overflow-hidden">
          {/* LEFT — FORM */}
          <ScrollArea className="border-r border-border">
            <div className="p-5 space-y-5">
              {/* Section 1 — Header / Client */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold tracking-tight">Header & Client</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Service Provider</Label>
                    <Input
                      value={serviceProvider}
                      onChange={e => setServiceProvider(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Client Name</Label>
                    <Input
                      value={clientName}
                      onChange={e => setClientName(e.target.value.toUpperCase())}
                      placeholder="BANCWISE TECHNOLOGIES LLP"
                      className="h-9 text-sm uppercase"
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
                          {proposalDate ? format(proposalDate, 'dd/MM/yyyy') : 'Pick date'}
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
                    <Label className="text-xs mb-1.5 block">Validity (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={validityDays}
                      onChange={e => setValidityDays(Number(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2 — Fees */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">Wallet & Fees</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={addExtraFee}
                  >
                    <Plus className="w-3 h-3" /> Add line
                  </Button>
                </div>

                <div
                  className={cn(
                    'rounded-md border border-border p-3 space-y-2 transition-opacity',
                    walletHidden && 'opacity-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">One-Time Wallet Recharge (INR)</Label>
                    <button
                      type="button"
                      onClick={() => setWalletHidden(v => !v)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                      title={walletHidden ? 'Show in proposal' : 'Hide from proposal'}
                    >
                      {walletHidden ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hidden
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Visible
                        </>
                      )}
                    </button>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={walletRecharge}
                    onChange={e => setWalletRecharge(Number(e.target.value) || 0)}
                    className="h-9 text-sm"
                    disabled={walletHidden}
                  />
                  <Label className="text-xs">Wallet Note</Label>
                  <Textarea
                    value={walletRechargeNote}
                    onChange={e => setWalletRechargeNote(e.target.value)}
                    className="text-xs min-h-[60px]"
                    disabled={walletHidden}
                  />
                </div>

                {[
                  {
                    key: 'setup',
                    label: 'One Time Set-Up Fees',
                    val: setupFees,
                    setVal: setSetupFees,
                    waived: setupFeesWaived,
                    setWaived: setSetupFeesWaived,
                    hidden: setupFeesHidden,
                    setHidden: setSetupFeesHidden,
                  },
                  {
                    key: 'amc',
                    label: 'Annual Maintenance Fees',
                    val: amcFees,
                    setVal: setAmcFees,
                    waived: amcWaived,
                    setWaived: setAmcWaived,
                    hidden: amcHidden,
                    setHidden: setAmcHidden,
                  },
                  {
                    key: 'min',
                    label: 'Minimum Monthly Billing Commitments',
                    val: minMonthly,
                    setVal: setMinMonthly,
                    waived: minMonthlyWaived,
                    setWaived: setMinMonthlyWaived,
                    hidden: minMonthlyHidden,
                    setHidden: setMinMonthlyHidden,
                  },
                ].map(f => (
                  <div
                    key={f.key}
                    className={cn(
                      'rounded-md border border-border p-3 transition-opacity',
                      f.hidden && 'opacity-50',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                      <Label className="text-xs">{f.label} (INR)</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={f.waived}
                            onCheckedChange={f.setWaived}
                            className="scale-75"
                            disabled={f.hidden}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            Not Applicable
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => f.setHidden(v => !v)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                          title={f.hidden ? 'Show in proposal' : 'Hide from proposal'}
                        >
                          {f.hidden ? (
                            <>
                              <EyeOff className="w-3 h-3" /> Hidden
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" /> Visible
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={f.val}
                      onChange={e => f.setVal(Number(e.target.value) || 0)}
                      className="h-9 text-sm"
                      disabled={f.hidden}
                    />
                  </div>
                ))}

                {/* Custom free-form lines */}
                {extraFees.map(f => (
                  <div
                    key={f.id}
                    className={cn(
                      'rounded-md border border-dashed border-border p-2 flex items-start gap-2 transition-opacity',
                      f.hidden && 'opacity-50',
                    )}
                  >
                    <Textarea
                      value={f.text}
                      onChange={e => updateExtraFee(f.id, { text: e.target.value })}
                      placeholder="Type anything (e.g. Onboarding Fee : ₹5,000 — waived for first month)"
                      className="text-xs min-h-[40px] flex-1"
                      disabled={f.hidden}
                    />
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => updateExtraFee(f.id, { hidden: !f.hidden })}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={f.hidden ? 'Show line' : 'Hide line'}
                        title={f.hidden ? 'Show' : 'Hide'}
                      >
                        {f.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExtraFee(f.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove line"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Section 3 — Per-API Pricing */}
              <section className="space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      Slab Based Pricing — Per API
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Each API can have its own slabs. Add or remove slabs individually.
                    </p>
                  </div>
                  {onApisChange && availableApis && availableApis.length > 0 && (
                    <ApiMultiSelect
                      available={availableApis}
                      selected={apis}
                      onChange={onApisChange}
                    />
                  )}
                </div>

                {onApisChange && apis.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {apis.map(a => (
                      <Badge
                        key={a.id}
                        variant="secondary"
                        className="text-[10px] h-5 pl-1.5 pr-1 gap-1 font-normal"
                      >
                        {a.name}
                        <button
                          type="button"
                          onClick={() =>
                            onApisChange(apis.filter(x => x.id !== a.id))
                          }
                          className="hover:bg-muted-foreground/20 rounded-sm p-0.5"
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {grouped.map(([category, catApis]) => (
                  <div key={category} className="rounded-md border border-border overflow-hidden">
                    <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
                      <p className="text-xs font-semibold">{category}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {catApis.length} API{catApis.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {catApis.map((api, idx) => {
                        const row = rows[api.id];
                        if (!row) return null;
                        return (
                          <div key={api.id} className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                  {api.name}
                                </p>
                                <Input
                                  value={row.apiTypeLabel}
                                  onChange={e => updateRow(api.id, { apiTypeLabel: e.target.value })}
                                  placeholder="API Type label (e.g. PAN (Supreme) - V2)"
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Select
                                  value={row.pricingType}
                                  onValueChange={(v: PricingType) =>
                                    updateRow(api.id, { pricingType: v })
                                  }
                                >
                                  <SelectTrigger className="h-7 text-xs w-[130px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="flat" className="text-xs">Flat</SelectItem>
                                    <SelectItem value="success" className="text-xs">Success-based</SelectItem>
                                    <SelectItem value="per_doc" className="text-xs">Per Document</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1.5 text-[11px]"
                                  onClick={() => addSlabToApi(api.id)}
                                  title="Add slab"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                {idx === 0 && catApis.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-1.5 text-[10px] text-muted-foreground"
                                    onClick={() => applySlabsToCategory(category, api.id)}
                                    title="Apply this row's slabs/pricing to all APIs in this category"
                                  >
                                    Apply→all
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Slab editor — vertical list of slabs for this API */}
                            <div className="space-y-1.5">
                              {row.slabs.map((slab, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="grid grid-cols-[1fr_90px_90px_28px] gap-1.5 items-center"
                                >
                                  <Input
                                    value={slab.label}
                                    onChange={e => updateSlab(api.id, sIdx, { label: e.target.value })}
                                    placeholder="Slab label (e.g. Upto 1L Hits)"
                                    className="h-7 text-xs"
                                  />
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={slab.primary}
                                    onChange={e =>
                                      updateSlab(api.id, sIdx, { primary: Number(e.target.value) || 0 })
                                    }
                                    className="h-7 text-xs"
                                    placeholder={row.pricingType === 'success' ? 'Success ₹' : '₹'}
                                  />
                                  {row.pricingType === 'success' ? (
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={slab.secondary ?? 0}
                                      onChange={e =>
                                        updateSlab(api.id, sIdx, {
                                          secondary: Number(e.target.value) || 0,
                                        })
                                      }
                                      className="h-7 text-xs"
                                      placeholder="NRF ₹"
                                    />
                                  ) : (
                                    <div className="text-[10px] text-muted-foreground self-center text-center">
                                      {row.pricingType === 'per_doc' ? '/doc' : '—'}
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeSlabFromApi(api.id, sIdx)}
                                    disabled={row.slabs.length <= 1}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <div className="grid grid-cols-[1fr_90px_90px_28px] gap-1.5 text-[9px] text-muted-foreground uppercase tracking-wider px-1">
                                <span>Slab Label</span>
                                <span>{row.pricingType === 'success' ? 'Success' : 'Price'}</span>
                                <span>{row.pricingType === 'success' ? 'NRF' : ''}</span>
                                <span />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {grouped.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    No APIs selected.
                  </p>
                )}
              </section>

              {/* Section 4 — Notes */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold tracking-tight">Notes</h3>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="text-xs min-h-[160px] font-mono leading-relaxed"
                />
              </section>
            </div>
          </ScrollArea>

          {/* RIGHT — PREVIEW (matches reference exactly) */}
          <ScrollArea className="bg-muted/40">
            <div className="p-6">
              <ProposalPreview
                serviceProvider={serviceProvider}
                clientName={clientName}
                proposalDate={proposalDate}
                validityDays={validityDays}
                walletRecharge={walletRecharge}
                walletRechargeNote={walletRechargeNote}
                walletHidden={walletHidden}
                setupFees={setupFees}
                setupFeesWaived={setupFeesWaived}
                setupFeesHidden={setupFeesHidden}
                amcFees={amcFees}
                amcWaived={amcWaived}
                amcHidden={amcHidden}
                minMonthly={minMonthly}
                minMonthlyWaived={minMonthlyWaived}
                minMonthlyHidden={minMonthlyHidden}
                extraFees={extraFees}
                grouped={grouped}
                rows={rows}
                notes={notes}
                fmtINR={fmtINR}
                fmtPrice={fmtPrice}
                proposalYearLabel={proposalYearLabel}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border shrink-0 bg-background flex-wrap">
          {enableSave ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                Save as
              </Label>
              <Input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder={clientName ? `${clientName} — Proposal` : 'e.g. Acme — FY 2025-26'}
                className="h-8 text-xs max-w-[320px]"
              />
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Live preview reflects all changes in real time.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {enableSave && (
              <Button onClick={handleSave} variant="secondary" className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                {initialSaveName ? 'Update' : 'Save'}
              </Button>
            )}
            {enableShare && (
              <Button onClick={handleShare} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {shareLabel}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Preview Component -------------------- */

interface PreviewProps {
  serviceProvider: string;
  clientName: string;
  proposalDate: Date;
  validityDays: number;
  walletRecharge: number;
  walletRechargeNote: string;
  walletHidden: boolean;
  setupFees: number;
  setupFeesWaived: boolean;
  setupFeesHidden: boolean;
  amcFees: number;
  amcWaived: boolean;
  amcHidden: boolean;
  minMonthly: number;
  minMonthlyWaived: boolean;
  minMonthlyHidden: boolean;
  extraFees: ExtraFee[];
  grouped: [string, CommercialAPI[]][];
  rows: Record<string, APIRow>;
  notes: string;
  fmtINR: (n: number) => string;
  fmtPrice: (n: number) => string;
  proposalYearLabel: string;
}

function ProposalPreview(p: PreviewProps) {
  const naLabel = '(Not Applicable)';

  return (
    <div className="mx-auto max-w-[820px] bg-background shadow-lg border border-border text-foreground">
      {/* Header band */}
      <div className="grid grid-cols-[260px_1fr] bg-[hsl(252,83%,57%)] text-white">
        {/* Logo box */}
        <div className="flex items-center justify-center px-6 py-6 border-r border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center">
              <span className="text-[hsl(252,83%,57%)] font-black text-lg">B</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">BeFiSc</span>
          </div>
        </div>
        {/* Title + meta */}
        <div className="px-5 py-4">
          <p className="text-base font-bold underline underline-offset-2 mb-2">
            Clients Commercial Proposal {p.proposalYearLabel}
          </p>
          <table className="text-[11px] w-full">
            <tbody>
              <tr>
                <td className="py-0.5 pr-3 align-top w-[130px]">Service Provider</td>
                <td className="py-0.5 font-medium">{p.serviceProvider || '—'}</td>
              </tr>
              <tr>
                <td className="py-0.5 pr-3 align-top">Client Name</td>
                <td className="py-0.5 font-medium">{p.clientName || '—'}</td>
              </tr>
              <tr>
                <td className="py-0.5 pr-3 align-top">Proposal Validity</td>
                <td className="py-0.5 font-medium">{p.validityDays} Days</td>
              </tr>
              <tr>
                <td className="py-0.5 pr-3 align-top">Proposal Date</td>
                <td className="py-0.5 font-medium">{format(p.proposalDate, 'dd/MM/yyyy')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet recharge block */}
      {!p.walletHidden && (
        <div className="border-t border-border px-5 py-3 bg-[hsl(220,40%,93%)]/60">
          <p className="text-[12px] font-semibold text-foreground">
            One-Time Wallet Recharge: {p.fmtINR(p.walletRecharge)} (Upfront Credit)
          </p>
          {p.walletRechargeNote && (
            <p className="text-[11px] mt-2 leading-relaxed text-foreground">
              {p.walletRechargeNote}
            </p>
          )}
        </div>
      )}

      {/* Fee rows */}
      {(() => {
        const builtIn = [
          {
            label: 'One Time Set-Up Fees',
            val: p.setupFees,
            waived: p.setupFeesWaived,
            hidden: p.setupFeesHidden,
          },
          {
            label: 'Annual Maintenance Fees',
            val: p.amcFees,
            waived: p.amcWaived,
            hidden: p.amcHidden,
          },
          {
            label: 'Minimum Monthly Billing Commitments',
            val: p.minMonthly,
            waived: p.minMonthlyWaived,
            hidden: p.minMonthlyHidden,
          },
        ].filter(r => !r.hidden);
        const extras = (p.extraFees || []).filter(f => !f.hidden && f.text.trim().length > 0);
        if (builtIn.length === 0 && extras.length === 0) return null;
        return (
          <div className="border-t border-border">
            {builtIn.map(row => (
              <div
                key={row.label}
                className="px-5 py-2 text-[12px] font-semibold text-foreground border-b border-border"
              >
                {row.label} : {p.fmtINR(row.val)}{' '}
                {row.waived && <span className="font-normal">{naLabel}</span>}
              </div>
            ))}
            {extras.map(f => (
              <div
                key={f.id}
                className="px-5 py-2 text-[12px] font-semibold text-foreground border-b border-border whitespace-pre-wrap"
              >
                {f.text}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Pricing table */}
      {p.grouped.length > 0 && (
        <PricingTable grouped={p.grouped} rows={p.rows} fmtPrice={p.fmtPrice} />
      )}

      {/* Notes */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[12px] font-bold mb-2">Note:</p>
        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-foreground">
          {p.notes}
        </pre>
        <p className="text-[12px] font-bold mt-4">With Regards,</p>
        <p className="text-[12px] font-bold">Team BeFiSc</p>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4 text-center text-[11px] space-y-1 text-muted-foreground">
        <p className="font-semibold text-foreground">BEFISC Private Limited</p>
        <p>A41, 3rd Floor, The Corenthum, India Accelerator, Sector 62</p>
        <p>Noida, Uttar Pradesh 201301</p>
        <p className="pt-1">CIN: U72900UP2022PTC174664 &nbsp;&nbsp; support@befisc.com</p>
      </div>
    </div>
  );
}

/* -------------------- Pricing Table (per-API slabs) -------------------- */

function PricingTable({
  grouped,
  rows,
  fmtPrice,
}: {
  grouped: [string, CommercialAPI[]][];
  rows: Record<string, APIRow>;
  fmtPrice: (n: number) => string;
}) {
  // Each API row owns its own slab columns. We render one sub-table per row
  // when a row's slab labels differ from the category's first row, otherwise
  // share the header. To keep it predictable & matching the reference
  // (single table look), we render category groups; within a group APIs that
  // share identical slab labels share a header.
  return (
    <div className="border-t border-border">
      {grouped.map(([category, catApis]) => {
        // Group consecutive APIs with the same slab-labels signature
        const segments: { signature: string; items: CommercialAPI[] }[] = [];
        catApis.forEach(api => {
          const row = rows[api.id];
          if (!row) return;
          const sig = row.slabs.map(s => s.label).join('|') + '::' + row.pricingType;
          const last = segments[segments.length - 1];
          if (last && last.signature === sig) {
            last.items.push(api);
          } else {
            segments.push({ signature: sig, items: [api] });
          }
        });

        return (
          <div key={category}>
            {segments.map((seg, segIdx) => {
              const firstApi = seg.items[0];
              const firstRow = rows[firstApi.id];
              if (!firstRow) return null;
              const slabCount = firstRow.slabs.length;
              return (
                <table
                  key={segIdx}
                  className="w-full border-collapse text-[11px]"
                  style={{ tableLayout: 'fixed' }}
                >
                  <colgroup>
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '22%' }} />
                    {firstRow.slabs.map((_, i) => (
                      <col key={i} style={{ width: `${60 / slabCount}%` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th
                        rowSpan={2}
                        className="border border-border bg-muted/30 text-foreground font-bold p-2 align-middle"
                      >
                        API Category
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-border bg-muted/30 text-foreground font-bold p-2 align-middle"
                      >
                        API Type
                      </th>
                      <th
                        colSpan={slabCount}
                        className="border border-border bg-muted/30 text-foreground font-bold p-2 text-center"
                      >
                        Slab Based Pricing On Total Transactions Per Month
                      </th>
                    </tr>
                    <tr>
                      {firstRow.slabs.map((s, i) => (
                        <th
                          key={i}
                          className="border border-border bg-muted/20 text-foreground font-bold p-1.5 text-center"
                        >
                          {s.label || `Slab ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seg.items.map((api, rowIdx) => {
                      const row = rows[api.id];
                      if (!row) return null;
                      return (
                        <tr key={api.id}>
                          {rowIdx === 0 && (
                            <td
                              rowSpan={seg.items.length}
                              className="border border-border p-2 font-bold align-top"
                            >
                              {category}
                              {seg.items.length > 1 && segIdx === 0 && (
                                <span className="block text-[9px] font-normal text-muted-foreground mt-0.5">
                                  ({PRICING_TYPE_LABELS[row.pricingType]})
                                </span>
                              )}
                            </td>
                          )}
                          <td className="border border-border p-2">{row.apiTypeLabel}</td>
                          {row.slabs.map((slab, i) => (
                            <td
                              key={i}
                              className="border border-border p-2 text-center tabular-nums"
                            >
                              {row.pricingType === 'success' ? (
                                <div className="leading-tight">
                                  <div>{fmtPrice(slab.primary)}</div>
                                  <div className="text-[9px] text-muted-foreground">
                                    {fmtPrice(slab.secondary ?? 0)} NRF
                                  </div>
                                </div>
                              ) : row.pricingType === 'per_doc' ? (
                                <span>
                                  {fmtPrice(slab.primary)}{' '}
                                  <span className="text-[9px] text-muted-foreground">/doc</span>
                                </span>
                              ) : (
                                fmtPrice(slab.primary)
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- API Multi-Select -------------------- */

function ApiMultiSelect({
  available,
  selected,
  onChange,
}: {
  available: CommercialAPI[];
  selected: CommercialAPI[];
  onChange: (apis: CommercialAPI[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIds = useMemo(() => new Set(selected.map(a => a.id)), [selected]);

  // Group available APIs by category for the picker
  const grouped = useMemo(() => {
    const map = new Map<string, CommercialAPI[]>();
    available.forEach(api => {
      const list = map.get(api.category) || [];
      list.push(api);
      map.set(api.category, list);
    });
    return Array.from(map.entries());
  }, [available]);

  const toggle = (api: CommercialAPI) => {
    if (selectedIds.has(api.id)) {
      onChange(selected.filter(a => a.id !== api.id));
    } else {
      onChange([...selected, api]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-8 text-xs gap-1.5 justify-between min-w-[180px]"
        >
          <span className="truncate">
            {selected.length === 0
              ? 'Add APIs…'
              : `${selected.length} API${selected.length === 1 ? '' : 's'} selected`}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search APIs…" className="h-9 text-xs" />
          <CommandList className="max-h-[320px]">
            <CommandEmpty className="text-xs py-4 text-center text-muted-foreground">
              No APIs found.
            </CommandEmpty>
            {grouped.map(([category, list]) => (
              <CommandGroup key={category} heading={category}>
                {list.map(api => {
                  const isSelected = selectedIds.has(api.id);
                  return (
                    <CommandItem
                      key={api.id}
                      value={`${category} ${api.name}`}
                      onSelect={() => toggle(api)}
                      className="text-xs gap-2"
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="flex-1 truncate">{api.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

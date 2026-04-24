import { useMemo, useState } from 'react';
import {
  FilePlus2,
  FileSpreadsheet,
  History,
  Mail,
  Pencil,
  Search,
  Send,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CommercialBuilder,
  type CommercialAPI,
  type CommercialData,
} from './CommercialBuilder';
import { API_DOCS } from './APIDocsTab';
import {
  COMMERCIAL_ADMIN_EMAIL,
  recordCommercialShare,
  saveCommercial,
  deleteCommercial,
  useCommercialShareHistory,
  useCommercials,
  type SavedCommercial,
} from '@/lib/commercialsStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

export function CommercialsTab() {
  const { toast } = useToast();
  const commercials = useCommercials();
  const history = useCommercialShareHistory();

  const [search, setSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('');

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<SavedCommercial | null>(null);
  const [builderApis, setBuilderApis] = useState<CommercialAPI[]>([]);

  const [shareTarget, setShareTarget] = useState<SavedCommercial | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<SavedCommercial | null>(null);

  // Full catalog available for inline multi-select inside the builder
  const availableApis: CommercialAPI[] = useMemo(
    () =>
      API_DOCS.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
      })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return commercials;
    return commercials.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.data.clientName.toLowerCase().includes(q),
    );
  }, [commercials, search]);

  const filteredHistory = useMemo(() => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      h =>
        h.recipients.some(e => e.toLowerCase().includes(q)) ||
        h.sharedBy.toLowerCase().includes(q) ||
        h.commercialName.toLowerCase().includes(q) ||
        h.clientName.toLowerCase().includes(q),
    );
  }, [history, historyFilter]);

  const openNew = () => {
    setEditing(null);
    setBuilderApis([]);
    setBuilderOpen(true);
  };

  const openEdit = (c: SavedCommercial) => {
    setEditing(c);
    setBuilderApis(c.data.apis ?? []);
    setBuilderOpen(true);
  };

  const handleSave = (input: { name: string; data: CommercialData }) => {
    const saved = saveCommercial({
      id: editing?.id,
      name: input.name,
      data: input.data,
    });
    toast({
      title: editing ? 'Commercial updated' : 'Commercial saved',
      description: `"${saved.name}" is available in your library.`,
    });
    setBuilderOpen(false);
    setEditing(null);
  };

  const openShare = (c: SavedCommercial) => {
    setShareTarget(c);
    setRecipients([]);
    setRecipientInput('');
    setSubject(`BeFiSc — Commercial Proposal for ${c.data.clientName || c.name}`);
    setBody(
      `Hi,\n\nPlease find attached the commercial proposal as discussed.\n\nLet us know if you have any questions.\n\nRegards,\nTeam BeFiSc`,
    );
  };

  const commitRecipientInput = () => {
    const raw = recipientInput.trim().replace(/[,;]+$/, '');
    if (!raw) return true;
    const parts = raw.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean);
    const invalid = parts.filter(p => !isValidEmail(p));
    if (invalid.length) {
      toast({
        title: 'Invalid email',
        description: `${invalid.join(', ')} is not a valid email.`,
        variant: 'destructive',
      });
      return false;
    }
    setRecipients(prev => Array.from(new Set([...prev, ...parts])));
    setRecipientInput('');
    return true;
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(e => e !== email));
  };

  const handleShareSubmit = () => {
    if (!shareTarget) return;
    if (!commitRecipientInput()) return;
    if (recipients.length === 0 && !recipientInput.trim()) {
      toast({
        title: 'Recipient required',
        description: 'Add at least one recipient email.',
        variant: 'destructive',
      });
      return;
    }
    if (!subject.trim()) {
      toast({
        title: 'Subject required',
        description: 'Enter an email subject.',
        variant: 'destructive',
      });
      return;
    }
    setConfirmShareOpen(true);
  };

  const performShare = () => {
    if (!shareTarget) return;
    const recs = recipients.length
      ? recipients
      : recipientInput.trim().split(/[\s,;]+/).filter(Boolean);
    recordCommercialShare({
      commercialId: shareTarget.id,
      commercialName: shareTarget.name,
      clientName: shareTarget.data.clientName,
      recipients: recs,
      subject,
      body,
    });
    toast({
      title: 'Commercial shared',
      description: `Sent "${shareTarget.name}" to ${recs.join(', ')} (CC: ${COMMERCIAL_ADMIN_EMAIL}).`,
    });
    setConfirmShareOpen(false);
    setShareTarget(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteCommercial(pendingDelete.id);
    toast({
      title: 'Commercial deleted',
      description: `"${pendingDelete.name}" was removed from your library.`,
    });
    setPendingDelete(null);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="library" className="w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="library" className="gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Library
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {commercials.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-3.5 h-3.5" />
              Share History
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {history.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <Button size="sm" className="h-9 gap-1.5" onClick={openNew}>
            <FilePlus2 className="w-4 h-4" />
            New Commercial
          </Button>
        </div>

        {/* LIBRARY */}
        <TabsContent value="library" className="mt-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="glass-card">
              <div className="p-10 text-center">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium">No saved commercials yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Build a structured pricing proposal and save it to your library.
                </p>
                <Button size="sm" onClick={openNew} className="gap-1.5">
                  <FilePlus2 className="w-4 h-4" /> Create your first commercial
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(c => {
                const apiCount = c.data.apis?.length ?? Object.keys(c.data.rows).length;
                return (
                  <Card key={c.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.data.clientName || 'No client name'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {apiCount} API{apiCount === 1 ? '' : 's'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span className="block uppercase tracking-wider text-[9px] mb-0.5">
                          Wallet
                        </span>
                        <span className="text-foreground font-medium">
                          ₹{c.data.walletRecharge.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider text-[9px] mb-0.5">
                          Validity
                        </span>
                        <span className="text-foreground font-medium">
                          {c.data.validityDays} days
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Updated {c.updatedAt}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 flex-1"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 flex-1 text-primary"
                        onClick={() => openShare(c)}
                      >
                        <Share2 className="w-3 h-3" /> Share
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDelete(c)}
                        aria-label="Delete commercial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SHARE HISTORY */}
        <TabsContent value="history" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by recipient, sender, client or proposal name..."
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                className="h-8 text-xs pl-8 pr-8"
              />
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
              {filteredHistory.length} / {history.length}
            </Badge>
          </div>

          {filteredHistory.length === 0 ? (
            <Card className="glass-card">
              <div className="p-8 text-center text-sm text-muted-foreground">
                {history.length === 0
                  ? 'No commercials shared yet.'
                  : `No history matches "${historyFilter}".`}
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map(record => (
                <Card key={record.id} className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        {record.recipients.map(email => (
                          <Badge
                            key={email}
                            variant="secondary"
                            className="text-[11px] px-1.5 py-0 h-5 font-normal"
                          >
                            {email}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        CC: {record.cc} · By {record.sharedBy} · {record.sharedAt}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <FileSpreadsheet className="w-3 h-3" />
                      {record.commercialName}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    {record.subject}
                  </p>
                  {record.body && (
                    <p className="text-[11px] text-muted-foreground italic border-l-2 border-border pl-2 whitespace-pre-line line-clamp-3">
                      {record.body}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Builder */}
      <CommercialBuilder
        open={builderOpen}
        onOpenChange={open => {
          setBuilderOpen(open);
          if (!open) {
            setEditing(null);
            setBuilderApis([]);
          }
        }}
        apis={builderApis}
        availableApis={availableApis}
        onApisChange={setBuilderApis}
        initialData={editing?.data}
        initialSaveName={editing?.name ?? ''}
        initialClientName={editing?.data.clientName ?? ''}
        enableSave
        enableShare={false}
        onSave={handleSave}
      />

      {/* Share Dialog */}
      <Dialog
        open={!!shareTarget}
        onOpenChange={open => {
          if (!open) setShareTarget(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Commercial
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send "{shareTarget?.name}" to one or more recipients. Admin is
              automatically added in CC.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  Recipient Emails <span className="text-destructive">*</span>
                </Label>
                <div className="min-h-9 px-2 py-1 rounded-md border border-input bg-background flex flex-wrap items-center gap-1 focus-within:ring-2 focus-within:ring-ring">
                  {recipients.map(email => (
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
                    type="email"
                    placeholder={recipients.length ? 'Add another...' : 'recipient@example.com'}
                    value={recipientInput}
                    onChange={e => setRecipientInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
                        if (recipientInput.trim()) {
                          e.preventDefault();
                          commitRecipientInput();
                        }
                      } else if (e.key === 'Backspace' && !recipientInput && recipients.length) {
                        removeRecipient(recipients[recipients.length - 1]);
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
                  {COMMERCIAL_ADMIN_EMAIL}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block">Email body</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="text-sm min-h-[140px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShareTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleShareSubmit} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Share */}
      <Dialog open={confirmShareOpen} onOpenChange={setConfirmShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Confirm & Send
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review the details before sending the commercial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1 text-sm">
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3">
              <span className="text-muted-foreground text-xs">Commercial</span>
              <span className="font-medium">{shareTarget?.name}</span>
              <span className="text-muted-foreground text-xs">Client</span>
              <span className="font-medium">{shareTarget?.data.clientName}</span>
              <span className="text-muted-foreground text-xs">To</span>
              <div className="flex flex-wrap gap-1">
                {(recipients.length
                  ? recipients
                  : recipientInput.trim().split(/[\s,;]+/).filter(Boolean)
                ).map(e => (
                  <Badge key={e} variant="secondary" className="text-[11px] font-normal">
                    {e}
                  </Badge>
                ))}
              </div>
              <span className="text-muted-foreground text-xs">CC</span>
              <span className="font-medium break-all">{COMMERCIAL_ADMIN_EMAIL}</span>
              <span className="text-muted-foreground text-xs">Subject</span>
              <span className="font-medium break-words">{subject}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmShareOpen(false)}>
              Back
            </Button>
            <Button onClick={performShare} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={open => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete commercial?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.name}" will be permanently removed from your library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

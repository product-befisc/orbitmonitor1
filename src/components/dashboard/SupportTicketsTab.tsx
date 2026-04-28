import { useMemo, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { mockTickets, type SupportTicket } from '@/lib/mockTickets';
import { cn } from '@/lib/utils';

const statusVariant: Record<string, 'secondary' | 'default' | 'outline'> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  CLOSED: 'outline',
};

// Build a threaded chat for a client across all their tickets (chronological)
function buildClientThread(client: string): Array<{ date: string; time: string; ticketId: string; text: string }> {
  return mockTickets
    .filter(t => t.client === client)
    .map(t => ({ date: t.date, time: t.time, ticketId: t.id, text: t.chatDescription }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function TicketDetail({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const thread = useMemo(() => buildClientThread(ticket.client), [ticket.client]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(ticket.aiSummary.replace(/\*\*/g, ''));
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{ticket.id}</h1>
            <p className="text-muted-foreground mt-1">
              {ticket.client} · {ticket.date} {ticket.time}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground">AI SUMMARY</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSpeech}
                  className={isSpeaking ? 'text-primary animate-pulse' : 'text-muted-foreground hover:text-foreground'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
              <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {ticket.aiSummary.split('\n').map((line, i) => {
                  const boldMatch = line.match(/^\*\*(.+?):\*\*(.*)$/);
                  if (boldMatch) {
                    return (
                      <p key={i} className="mt-2">
                        <span className="font-semibold">{boldMatch[1]}:</span>{boldMatch[2]}
                      </p>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-semibold mt-2">{line.replace(/\*\*/g, '')}</p>;
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-4">
                WHATSAPP CHAT — FULL THREAD ({thread.length} messages)
              </p>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {thread.map((msg, i) => {
                  const isCurrent = msg.ticketId === ticket.id;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'rounded-lg p-3 border',
                        isCurrent ? 'bg-primary/5 border-primary/30' : 'bg-muted border-border'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {msg.date} · {msg.time.slice(0, 5)}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {msg.ticketId}
                          {isCurrent && ' · current'}
                        </Badge>
                      </div>
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{msg.text}</pre>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="p-6 space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-1.5">Status</p>
              <Select defaultValue={ticket.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                  <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                  <SelectItem value="CLOSED">CLOSED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ticket.client}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ticket.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ticket.createdBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ticket.date}, {ticket.time}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SupportTicketsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const stats = useMemo(() => {
    const total = mockTickets.length;
    const open = mockTickets.filter(t => t.status === 'OPEN').length;
    const inProgress = mockTickets.filter(t => t.status === 'IN_PROGRESS').length;
    const closed = mockTickets.filter(t => t.status === 'CLOSED').length;
    return { total, open, inProgress, closed };
  }, []);

  const categories = useMemo(() => Array.from(new Set(mockTickets.map(t => t.category))), []);

  const filtered = useMemo(() => {
    return mockTickets
      .filter(t => {
        if (clientFilter && !t.client.toLowerCase().includes(clientFilter.toLowerCase())) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (fromDate && t.date < fromDate) return false;
        if (toDate && t.date > toDate) return false;
        return true;
      })
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [clientFilter, categoryFilter, statusFilter, fromDate, toDate]);

  if (selectedId) {
    const ticket = mockTickets.find(t => t.id === selectedId);
    if (ticket) return <TicketDetail ticket={ticket} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Issues Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Issues', value: stats.total },
          { label: 'Open', value: stats.open },
          { label: 'In Progress', value: stats.inProgress },
          { label: 'Closed', value: stats.closed },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold text-foreground mt-2">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-xs">Client Name</Label>
            <Input
              placeholder="Search client..."
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-24">Time</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-56">Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(t.id)}
                >
                  <TableCell className="font-medium">{t.id}</TableCell>
                  <TableCell>{t.client}</TableCell>
                  <TableCell className="text-muted-foreground">{t.category}</TableCell>
                  <TableCell className="text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="text-muted-foreground">{t.time}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.createdBy}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No tickets match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import type { SupportTicket } from '@/lib/mockTickets';

interface Props {
  ticket: SupportTicket;
  onBack: () => void;
}

export const SupportTicketDetail = ({ ticket, onBack }: Props) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const plainText = ticket.aiSummary.replace(/\*\*/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Issues
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{ticket.id}</h1>
            <p className="text-muted-foreground mt-1">
              {ticket.client} · {ticket.date} {ticket.time}
            </p>
          </div>

          {/* AI Summary */}
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
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-semibold mt-2">{line.replace(/\*\*/g, '')}</p>;
                  }
                  const boldMatch = line.match(/^\*\*(.+?):\*\*(.*)$/);
                  if (boldMatch) {
                    return (
                      <p key={i} className="mt-2">
                        <span className="font-semibold">{boldMatch[1]}:</span>{boldMatch[2]}
                      </p>
                    );
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chat Description */}
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-4">WHATSAPP CHAT / DESCRIPTION</p>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{ticket.chatDescription}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
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
};

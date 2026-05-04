import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockTickets, formatSLA } from '@/lib/mockTickets';

interface Props {
  client: string;
}

const statusVariant: Record<string, 'secondary' | 'default' | 'outline'> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  CLOSED: 'outline',
};

export function ClientSupportTicketsTab({ client }: Props) {
  const tickets = useMemo(
    () =>
      mockTickets
        .filter(t => t.client === client)
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [client]
  );

  if (tickets.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No active support tickets for {client}.
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Date</TableHead>
            <TableHead>Issue Summary</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-40">SLA (resolution)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map(t => {
            const summary = t.aiSummary.split('\n')[0] ?? t.chatDescription;
            const sla = formatSLA(t);
            const isResolved = t.status === 'CLOSED';
            return (
              <TableRow key={t.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {t.date} · {t.time.slice(0, 5)}
                </TableCell>
                <TableCell className="text-sm">{summary}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[t.status]}>{t.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className={isResolved ? 'text-foreground font-medium text-sm' : 'text-muted-foreground italic text-sm'}>
                  {sla}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

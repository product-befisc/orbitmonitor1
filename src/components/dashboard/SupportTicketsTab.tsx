import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Plus } from 'lucide-react';
import { mockTickets, type SupportTicket } from '@/lib/mockTickets';
import { SupportTicketDetail } from './SupportTicketDetail';
import type { GlobalFilterState } from './GlobalFilters';

interface SupportTicketsTabProps {
  globalFilters: GlobalFilterState;
}

export const SupportTicketsTab = ({ globalFilters }: SupportTicketsTabProps) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredTickets = useMemo(() => {
    return mockTickets.filter(t => {
      if (globalFilters.client !== 'all' && t.client !== globalFilters.client) return false;
      if (globalFilters.status !== 'all') {
        const statusMap: Record<string, string> = { healthy: 'CLOSED', warning: 'IN_PROGRESS', critical: 'OPEN' };
        if (t.status !== statusMap[globalFilters.status]) return false;
      }
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      return true;
    });
  }, [globalFilters, fromDate, toDate]);

  const stats = useMemo(() => ({
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === 'OPEN').length,
    inProgress: filteredTickets.filter(t => t.status === 'IN_PROGRESS').length,
    closed: filteredTickets.filter(t => t.status === 'CLOSED').length,
  }), [filteredTickets]);

  if (selectedTicket) {
    return <SupportTicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Issues Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Log Issue
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Issues', value: stats.total },
          { label: 'Open', value: stats.open },
          { label: 'In Progress', value: stats.inProgress },
          { label: 'Closed', value: stats.closed },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">From</p>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">To</p>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map(ticket => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>{ticket.client}</TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>{ticket.date}</TableCell>
                  <TableCell>{ticket.time}</TableCell>
                  <TableCell>
                    <Badge variant={
                      ticket.status === 'OPEN' ? 'secondary' :
                      ticket.status === 'IN_PROGRESS' ? 'default' : 'outline'
                    }>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ticket.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

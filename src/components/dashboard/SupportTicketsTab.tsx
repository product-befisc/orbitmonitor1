import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Plus } from 'lucide-react';
import { mockTickets, type SupportTicket } from '@/lib/mockTickets';
import { SupportTicketDetail } from './SupportTicketDetail';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { format, subMonths, subDays, isAfter, isBefore, parseISO } from 'date-fns';

export const SupportTicketsTab = () => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [chartRange, setChartRange] = useState<string>('3-months');

  const hasCustomDate = fromDate !== '' || toDate !== '';

  const uniqueClients = useMemo(() => [...new Set(mockTickets.map(t => t.client))], []);
  const uniqueCategories = useMemo(() => [...new Set(mockTickets.map(t => t.category))], []);

  const filteredTickets = useMemo(() => {
    return mockTickets.filter(t => {
      if (clientFilter !== 'all' && t.client !== clientFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      return true;
    });
  }, [clientFilter, categoryFilter, statusFilter, fromDate, toDate]);

  const stats = useMemo(() => ({
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === 'OPEN').length,
    inProgress: filteredTickets.filter(t => t.status === 'IN_PROGRESS').length,
    closed: filteredTickets.filter(t => t.status === 'CLOSED').length,
  }), [filteredTickets]);

  // Chart data based on chartRange
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let customLabel = '';

    if (chartRange === 'custom' && hasCustomDate) {
      startDate = fromDate ? parseISO(fromDate) : subMonths(now, 3);
      endDate = toDate ? parseISO(toDate) : now;
      customLabel = `${fromDate || '...'} → ${toDate || '...'}`;
    } else {
      switch (chartRange) {
        case '3-months': startDate = subMonths(now, 3); break;
        case '6-months': startDate = subMonths(now, 6); break;
        default: startDate = subMonths(now, 3);
      }
    }

    // Group tickets by week
    const weekMap = new Map<string, { week: string; open: number; inProgress: number; closed: number }>();
    filteredTickets.forEach(t => {
      const ticketDate = parseISO(t.date);
      if (isBefore(ticketDate, startDate) || isAfter(ticketDate, endDate)) return;
      // Get week start (Monday)
      const day = ticketDate.getDay();
      const diff = ticketDate.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(ticketDate);
      weekStart.setDate(diff);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const existing = weekMap.get(weekKey) || { week: weekKey, open: 0, inProgress: 0, closed: 0 };
      if (t.status === 'OPEN') existing.open++;
      else if (t.status === 'IN_PROGRESS') existing.inProgress++;
      else existing.closed++;
      weekMap.set(weekKey, existing);
    });

    return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week));
  }, [chartRange, filteredTickets, fromDate, toDate, hasCustomDate]);

  // Auto-switch to custom when dates are set
  const handleFromDate = (val: string) => {
    setFromDate(val);
    if (val || toDate) setChartRange('custom');
  };
  const handleToDate = (val: string) => {
    setToDate(val);
    if (val || fromDate) setChartRange('custom');
  };

  const customDateLabel = useMemo(() => {
    if (!hasCustomDate) return '';
    const from = fromDate ? format(parseISO(fromDate), 'dd MMM') : '...';
    const to = toDate ? format(parseISO(toDate), 'dd MMM') : '...';
    return `${from} - ${to}`;
  }, [fromDate, toDate, hasCustomDate]);

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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">Client Name</p>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {uniqueClients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">Category</p>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">Status</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">From</p>
              <Input type="date" value={fromDate} onChange={e => handleFromDate(e.target.value)} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">To</p>
              <Input type="date" value={toDate} onChange={e => handleToDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Over Time Chart */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-foreground">Tickets Over Time</h3>
            <div className="flex items-center bg-muted rounded-full p-1 gap-0.5">
              {[
                { value: '3-months', label: 'Last 3 Months' },
                { value: '6-months', label: 'Last 6 Months' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setChartRange(opt.value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                    chartRange === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
              {hasCustomDate && (
                <button
                  onClick={() => setChartRange('custom')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                    chartRange === 'custom'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Custom ({customDateLabel})
                </button>
              )}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(d) => format(parseISO(d), 'dd MMM')}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                  labelFormatter={(d) => `Week of ${format(parseISO(d as string), 'dd MMM yyyy')}`}
                />
                <Bar dataKey="open" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} name="Open" />
                <Bar dataKey="inProgress" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="In Progress" />
                <Bar dataKey="closed" stackId="a" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Closed" />
              </BarChart>
            </ResponsiveContainer>
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

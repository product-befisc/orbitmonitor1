import { Flag, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getClientIPs } from '@/lib/mockClientIPs';

interface Props {
  client: string;
}

export function ClientIPWhitelistTab({ client }: Props) {
  const ips = getClientIPs(client);
  const flagged = ips.filter(i => !i.whitelisted).length;

  return (
    <div className="space-y-4">
      {flagged > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <Flag className="w-4 h-4" />
          <span className="font-medium">
            {flagged} IP{flagged > 1 ? 's' : ''} not whitelisted
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-medium">All IPs are whitelisted</span>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP Address</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Added On</TableHead>
            <TableHead className="w-40">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ips.map(entry => (
            <TableRow key={entry.ip}>
              <TableCell className="font-mono text-sm">{entry.ip}</TableCell>
              <TableCell className="text-sm">{entry.label}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{entry.addedOn}</TableCell>
              <TableCell>
                {entry.whitelisted ? (
                  <Badge variant="outline" className="border-success/50 text-success">
                    Whitelisted
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <Flag className="w-3 h-3" />
                    Not Whitelisted
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

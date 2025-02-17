
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from 'lucide-react';

interface StatusBadgeCellProps {
  status: string;
  error?: string | null;
}

const StatusBadgeCell = ({ status, error }: StatusBadgeCellProps) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'error':
        return 'destructive';
      case 'analyzing':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <TableCell>
      <Badge variant={getBadgeVariant(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </TableCell>
  );
};

export default StatusBadgeCell;

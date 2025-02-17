
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface RetryCellProps {
  error?: string | null;
  onRetry?: () => void;
}

const RetryCell = ({ error, onRetry }: RetryCellProps) => {
  if (!error || !onRetry) return <TableCell />;

  return (
    <TableCell>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </Button>
    </TableCell>
  );
};

export default RetryCell;

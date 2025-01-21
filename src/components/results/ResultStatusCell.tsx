import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultStatusCellProps {
  status: string | undefined;
  hasChatbot: boolean;
  technologies: string;
  lastChecked?: string;
}

const ResultStatusCell = ({ status, hasChatbot, technologies, lastChecked }: ResultStatusCellProps) => {
  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean) => {
    if (!status) return 'secondary';
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (hasChatbot) return 'success';
    return 'secondary';
  };

  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant={getChatbotStatusColor(status, hasChatbot)}
              className="cursor-help"
            >
              {technologies}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last checked: {lastChecked ? new Date(lastChecked).toLocaleString() : 'N/A'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};

export default ResultStatusCell;
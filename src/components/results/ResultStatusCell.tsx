
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

interface ResultStatusCellProps {
  status: string | undefined;
  hasChatbot: boolean;
  technologies: string;
  lastChecked?: string;
  chatSolutions?: string[];
}

const ResultStatusCell = ({ 
  status, 
  hasChatbot, 
  technologies, 
  lastChecked,
  chatSolutions 
}: ResultStatusCellProps) => {
  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean) => {
    if (!status) return 'secondary';
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (hasChatbot) return 'success';
    return 'secondary';
  };

  const formatTooltipContent = () => {
    const content = [];
    
    if (lastChecked) {
      content.push(`Last checked: ${formatDistanceToNow(new Date(lastChecked), { addSuffix: true })}`);
    }
    
    if (hasChatbot && chatSolutions && chatSolutions.length > 0) {
      if (chatSolutions.length === 1) {
        content.push(`Using ${chatSolutions[0]} chatbot`);
      } else {
        content.push(`Primary: ${chatSolutions[0]}`);
        content.push(`Additional providers: ${chatSolutions.slice(1).join(', ')}`);
      }
    }
    
    return content.join('\n');
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
          <TooltipContent className="max-w-[300px] whitespace-pre-line">
            <p>{formatTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};

export default ResultStatusCell;

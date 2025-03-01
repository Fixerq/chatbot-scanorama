
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
  chatSolutions?: string[];
  onResultUpdate?: () => void;
}

const ResultStatusCell = ({ 
  status, 
  hasChatbot, 
  technologies, 
  lastChecked, 
  chatSolutions,
  onResultUpdate
}: ResultStatusCellProps) => {
  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean) => {
    if (!status) return 'secondary';
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (status === 'Processing...') return 'secondary';
    if (hasChatbot) return 'success';
    return 'secondary';
  };

  // Improved tooltip content with verification status
  const formatTooltipContent = () => {
    const content = [];
    
    if (lastChecked) {
      content.push(`Last checked: ${new Date(lastChecked).toLocaleString()}`);
    }
    
    if (status === 'Processing...') {
      content.push('Analysis in progress...');
    } else if (status?.toLowerCase().includes('error')) {
      content.push(`Error: ${status}`);
    } else if (status?.toLowerCase().includes('low confidence')) {
      content.push('No chatbot detected (potential false positive filtered)');
    } else if (hasChatbot && chatSolutions && chatSolutions.length > 0) {
      if (chatSolutions.length === 1) {
        content.push(`Detected ${chatSolutions[0]} chatbot`);
      } else {
        content.push(`Primary: ${chatSolutions[0]}`);
        content.push(`Additional providers: ${chatSolutions.slice(1).join(', ')}`);
      }
    } else if (status) {
      content.push(`Status: ${status}`);
    }
    
    if (onResultUpdate) {
      content.push('Click to refresh analysis');
    }
    
    return content.join('\n');
  };

  // Updated display text to be more accurate
  const getDisplayText = () => {
    if (technologies === 'Custom Chat' && status?.toLowerCase().includes('low confidence')) {
      return 'No chatbot detected';
    }
    return technologies || 'Analyzing...';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onResultUpdate) {
      console.log('ResultStatusCell clicked, triggering update');
      onResultUpdate();
    }
  };

  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={handleClick} 
              className={`inline-block ${onResultUpdate ? 'cursor-pointer hover:opacity-80' : 'cursor-help'}`}
            >
              <Badge 
                variant={getChatbotStatusColor(status, hasChatbot)}
                className={`${status === 'Processing...' ? 'animate-pulse' : ''} px-3 py-1`}
              >
                {getDisplayText()}
              </Badge>
            </div>
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

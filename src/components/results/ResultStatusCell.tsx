
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
  confidence?: number;
  verificationStatus?: string;
  onResultUpdate?: () => void;
}

const ResultStatusCell = ({ 
  status, 
  hasChatbot, 
  technologies, 
  lastChecked, 
  chatSolutions,
  confidence,
  verificationStatus,
  onResultUpdate
}: ResultStatusCellProps) => {
  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean, confidence?: number) => {
    if (!status) return 'secondary';
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (status === 'Processing...') return 'secondary';
    if (hasChatbot) {
      // If we have confidence data, use it to determine the color
      if (confidence !== undefined) {
        if (confidence >= 0.9) return 'success';
        if (confidence >= 0.75) return 'success';
        if (confidence >= 0.5) return 'secondary'; // Changed from 'warning' to 'secondary'
        return 'secondary';
      }
      return 'success';
    }
    return 'secondary';
  };

  // Format the display text to be more user-friendly
  const getDisplayText = () => {
    if (technologies === 'Custom Chat') {
      return 'Website Chatbot';
    }
    if (status?.toLowerCase().includes('no chatbot')) {
      return 'No chatbot detected';
    }
    return technologies || 'Analyzing...';
  };

  // Get confidence level text
  const getConfidenceText = (confidence?: number) => {
    if (confidence === undefined) return '';
    if (confidence >= 0.9) return 'Very high confidence';
    if (confidence >= 0.75) return 'High confidence';
    if (confidence >= 0.5) return 'Medium confidence';
    if (confidence >= 0.25) return 'Low confidence';
    return 'Very low confidence';
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
    } else if (status?.toLowerCase().includes('no chatbot')) {
      content.push('No chatbot detected (verified)');
    } else if (hasChatbot && chatSolutions && chatSolutions.length > 0) {
      if (confidence !== undefined) {
        content.push(getConfidenceText(confidence));
      }
      
      if (verificationStatus) {
        content.push(`Verification: ${verificationStatus}`);
      }
      
      if (chatSolutions.length === 1) {
        let solution = chatSolutions[0];
        if (solution === "Website Chatbot" || solution === "Custom Chat") {
          content.push(`Website has a custom chatbot solution`);
        } else {
          content.push(`Detected ${solution} chatbot`);
        }
      } else {
        const primary = chatSolutions[0] === "Custom Chat" ? "Website Chatbot" : chatSolutions[0];
        content.push(`Primary: ${primary}`);
        
        const additional = chatSolutions.slice(1).map(s => s === "Custom Chat" ? "Website Chatbot" : s);
        content.push(`Additional providers: ${additional.join(', ')}`);
      }
    } else if (status) {
      content.push(`Status: ${status}`);
    }
    
    if (onResultUpdate) {
      content.push('Click to refresh analysis with enhanced verification');
    }
    
    return content.join('\n');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onResultUpdate) {
      console.log('ResultStatusCell clicked, triggering update with enhanced verification');
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
                variant={getChatbotStatusColor(status, hasChatbot, confidence)}
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

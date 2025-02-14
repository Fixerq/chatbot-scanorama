
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Loader2, Bot, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResultStatusCellProps {
  status?: string;
  hasChatbot?: boolean;
  technologies: string;
  lastChecked?: string;
  chatSolutions?: string[];
  isAnalyzing?: boolean;
}

const ResultStatusCell: React.FC<ResultStatusCellProps> = ({
  status,
  hasChatbot,
  technologies,
  lastChecked,
  chatSolutions,
  isAnalyzing
}) => {
  const showSpinner = isAnalyzing || status === 'processing';

  if (showSpinner) {
    return (
      <TableCell>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">Analyzing...</span>
        </div>
      </TableCell>
    );
  }

  if (status?.toLowerCase().includes('error')) {
    return (
      <TableCell>
        <div className="text-red-500 dark:text-red-400">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>{status}</span>
          </div>
          {lastChecked && (
            <div className="text-xs text-gray-500 mt-1">
              Last attempt: {new Date(lastChecked).toLocaleString()}
            </div>
          )}
        </div>
      </TableCell>
    );
  }

  return (
    <TableCell>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {hasChatbot ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="success" className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    <span>Chatbot Detected</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>A chatbot was found on this website</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>No Chatbot Found</span>
            </Badge>
          )}
        </div>
        
        {chatSolutions && chatSolutions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chatSolutions.map((solution, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {solution}
              </Badge>
            ))}
          </div>
        )}
        
        {lastChecked && (
          <div className="text-xs text-gray-500">
            Last checked: {new Date(lastChecked).toLocaleString()}
          </div>
        )}
      </div>
    </TableCell>
  );
};

export default ResultStatusCell;



import React, { useEffect } from 'react';
import { TableCell } from "@/components/ui/table";
import { Loader2, Bot, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';

interface ResultStatusCellProps {
  status?: string;
  hasChatbot?: boolean;
  technologies: string;
  lastChecked?: string;
  chatSolutions?: string[];
  isAnalyzing?: boolean;
  analysis_result?: {
    has_chatbot: boolean;
    chatSolutions: string[];
    status: string;
    error?: string;
    lastChecked?: string;
    details?: {
      patterns?: Array<{
        type: string;
        pattern: string;
        matched: string;
      }>;
      error?: string;
    };
  };
  url?: string;
  onAnalysisUpdate?: (result: any) => void;
}

const ResultStatusCell: React.FC<ResultStatusCellProps> = ({
  status,
  analysis_result,
  isAnalyzing,
  url,
  onAnalysisUpdate
}) => {
  useEffect(() => {
    if (!url) return;

    // Subscribe to real-time updates for this URL's analysis results
    const channel = supabase
      .channel('analysis_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results',
          filter: `url=eq.${url}`
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          if (onAnalysisUpdate) {
            onAnalysisUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [url, onAnalysisUpdate]);

  if (isAnalyzing || status?.toLowerCase() === 'analyzing...') {
    return (
      <TableCell>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">Analyzing...</span>
        </div>
      </TableCell>
    );
  }

  if (status?.toLowerCase().includes('error') || analysis_result?.error) {
    return (
      <TableCell>
        <div className="text-red-500 dark:text-red-400">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>{analysis_result?.error || status}</span>
          </div>
          {analysis_result?.lastChecked && (
            <div className="text-xs text-gray-500 mt-1">
              Last attempt: {new Date(analysis_result.lastChecked).toLocaleString()}
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
          {analysis_result?.has_chatbot ? (
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
                  {analysis_result.details?.patterns && analysis_result.details.patterns.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Matched Patterns:</p>
                      <ul className="text-xs">
                        {analysis_result.details.patterns.map((pattern, i) => (
                          <li key={i} className="mt-1">
                            <span className="font-medium">{pattern.type}:</span> {pattern.matched}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
        
        {analysis_result?.chatSolutions && analysis_result.chatSolutions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {analysis_result.chatSolutions.map((solution, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {solution}
              </Badge>
            ))}
          </div>
        )}
        
        {analysis_result?.lastChecked && (
          <div className="text-xs text-gray-500">
            Last checked: {new Date(analysis_result.lastChecked).toLocaleString()}
          </div>
        )}
      </div>
    </TableCell>
  );
};

export default ResultStatusCell;


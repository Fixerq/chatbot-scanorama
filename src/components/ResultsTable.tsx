import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatbotDetectionResponse } from '@/types/chatbot';

export interface Result {
  url: string;
  status?: string;
  details?: {
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
  };
}

interface ResultsTableProps {
  results: Result[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const formatUrl = (url: string) => {
    if (!url) return 'N/A';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean) => {
    if (!status) return 'gray';
    if (hasChatbot) return 'green';
    if (status.toLowerCase().includes('error')) return 'red';
    return 'yellow';
  };

  const formatChatbotInfo = (result: Result) => {
    if (!result.status) return 'Pending Analysis';
    if (result.status.toLowerCase().includes('error')) return result.status;
    
    const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
    
    if (hasChatbot) {
      return (
        <div className="flex items-center gap-2">
          <span>Chatbot Detected</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Solutions detected:</p>
                <ul className="list-disc pl-4">
                  {result.details.chatSolutions.map((solution, index) => (
                    <li key={index}>{solution}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }
    
    return 'No chatbot detected';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Chatbot Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            
            return (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {result.url ? (
                    <a 
                      href={formatUrl(result.url)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {result.url}
                    </a>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell>{result.details?.title || 'N/A'}</TableCell>
                <TableCell>{result.details?.description || 'N/A'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={hasChatbot ? "success" : "secondary"}
                    className={`${hasChatbot ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
                  >
                    {formatChatbotInfo(result)}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
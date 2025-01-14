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
  const formatUrl = (url: string) => url ? url.startsWith('http') ? url : `https://${url}` : 'N/A';

  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean) => 
    !status ? 'secondary' : hasChatbot ? 'success' : status.toLowerCase().includes('error') ? 'destructive' : 'secondary';

  const formatChatbotInfo = (result: Result) => {
    if (!result.status) return 'Pending Analysis';
    if (result.status.toLowerCase().includes('error')) return result.status;
    
    const hasChatbot = result.details?.chatSolutions?.length > 0;
    return hasChatbot ? 'Chatbot Detected' : 'No chatbot detected';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
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
                <TableCell>
                  <Badge 
                    variant={getChatbotStatusColor(result.status, hasChatbot)}
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
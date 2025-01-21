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
    try {
      // Remove protocol (http:// or https://) if present
      let cleanUrl = url.replace(/^(https?:\/\/)/, '');
      
      // Get just the hostname (root domain)
      const hostname = cleanUrl.split('/')[0];
      
      // Remove any parameters or fragments
      const rootDomain = hostname.split('?')[0].split('#')[0];
      
      // Add back https:// for the actual link
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      
      return {
        displayUrl: rootDomain,
        fullUrl: fullUrl
      };
    } catch (error) {
      console.error('Error formatting URL:', error);
      return {
        displayUrl: url,
        fullUrl: url.startsWith('http') ? url : `https://${url}`
      };
    }
  };

  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean) => {
    if (!status) return 'secondary';
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (hasChatbot) return 'success';
    return 'secondary';
  };

  const formatInstalledTechnologies = (result: Result) => {
    if (!result.status) return 'Analyzing...';
    if (result.status.toLowerCase().includes('error')) return result.status;
    
    const chatSolutions = result.details?.chatSolutions || [];
    if (chatSolutions.length === 0) return 'No chatbot detected';
    
    return chatSolutions.join(', ');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Installed Technologies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            const technologies = formatInstalledTechnologies(result);
            const { displayUrl, fullUrl } = formatUrl(result.url);
            
            return (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {result.url ? (
                    <a 
                      href={fullUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {displayUrl}
                    </a>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell>{result.details?.title || 'N/A'}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant={getChatbotStatusColor(result.status, hasChatbot)}
                          className="cursor-help"
                        >
                          {technologies}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Last checked: {result.details?.lastChecked ? new Date(result.details.lastChecked).toLocaleString() : 'N/A'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
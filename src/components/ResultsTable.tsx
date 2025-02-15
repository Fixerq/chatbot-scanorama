
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatUrl } from '@/utils/urlFormatting';

export interface Result {
  url: string;
  title?: string;
  description?: string;
  business_name?: string;
  website_url?: string;
  address?: string;
  placeId?: string;
  businessType?: string;
  error?: string;
  status?: string;
  details?: {
    search_batch_id: string;
    business_name?: string;
    title?: string;
    description?: string;
    address?: string;
    website_url?: string;
    [key: string]: any;
  };
  analysis_result?: {
    has_chatbot: boolean;
    chatSolutions: string[];
    status: string;
    error?: string;
    details?: {
      dynamic_loading?: boolean;
      chat_elements?: boolean;
      meta_tags?: boolean;
      websockets?: boolean;
    };
  };
}

interface ResultsTableProps {
  results: Result[];
  processing?: boolean;
  isLoading?: boolean;
}

const ResultsTable = ({ results, processing, isLoading }: ResultsTableProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableCaption className="text-muted-foreground">Recent search results.</TableCaption>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead className="w-[100px] text-white/70">Status</TableHead>
            <TableHead className="text-white/70">Title</TableHead>
            <TableHead className="text-white/70">URL</TableHead>
            <TableHead className="text-white/70">Analysis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, i) => {
            const { displayUrl } = formatUrl(result.url);
            return (
              <TableRow 
                key={i} 
                className="border-white/10 hover:bg-white/5 transition-colors"
              >
                <TableCell>
                  {result.error ? (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                      Error
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                      OK
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium text-white/90">{result.title}</TableCell>
                <TableCell>
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                  >
                    {displayUrl}
                  </a>
                </TableCell>
                <TableCell>
                  {result.analysis_result ? (
                    <div className="space-y-1">
                      <Badge 
                        variant={result.analysis_result.has_chatbot ? "success" : "secondary"}
                        className={result.analysis_result.has_chatbot ? 
                          "bg-green-500/20 text-green-300" : 
                          "bg-gray-500/20 text-gray-300"}
                      >
                        {result.analysis_result.has_chatbot ? "Chatbot Detected" : "No Chatbot"}
                      </Badge>
                      {result.analysis_result.chatSolutions.length > 0 && (
                        <div className="text-sm text-gray-400">
                          Solutions: {result.analysis_result.chatSolutions.join(", ")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">Analyzing...</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {(processing || isLoading) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Processing...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;


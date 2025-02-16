
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
import ResultStatusCell from './results/ResultStatusCell';
import { AnalysisResult } from '@/utils/types/search';

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
  analysis_result?: AnalysisResult;
}

interface ResultsTableProps {
  results: Result[];
  processing?: boolean;
  isLoading?: boolean;
  onResultUpdate?: (updatedResult: Result) => void;
}

const ResultsTable = ({ results, processing, isLoading, onResultUpdate }: ResultsTableProps) => {
  // Filter out failed results
  const validResults = results.filter(result => {
    const hasError = result.error || 
                    result.status?.toLowerCase().includes('error') || 
                    result.analysis_result?.error;
    return !hasError;
  });

  const handleAnalysisUpdate = (url: string, newAnalysis: AnalysisResult) => {
    if (onResultUpdate) {
      const resultToUpdate = results.find(r => r.url === url);
      if (resultToUpdate) {
        onResultUpdate({
          ...resultToUpdate,
          analysis_result: newAnalysis,
          status: newAnalysis.status
        });
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableCaption className="text-muted-foreground">Recent search results.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Analysis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validResults.map((result, i) => {
            const { displayUrl } = formatUrl(result.url);
            return (
              <TableRow key={i}>
                <TableCell>
                  <Badge variant="secondary">OK</Badge>
                </TableCell>
                <TableCell className="font-medium">{result.title}</TableCell>
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
                <ResultStatusCell
                  status={result.status}
                  analysis_result={result.analysis_result}
                  isAnalyzing={result.status === 'analyzing'}
                  hasChatbot={result.analysis_result?.has_chatbot}
                  technologies=""
                  chatSolutions={result.analysis_result?.chatSolutions}
                  lastChecked={result.analysis_result?.lastChecked}
                  url={result.url}
                  onAnalysisUpdate={(newAnalysis) => handleAnalysisUpdate(result.url, newAnalysis)}
                />
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



import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAnalysisStatus, formatChatbotProviders, getBusinessName } from '@/utils/analysisFormatter';
import ResultUrlCell from './results/ResultUrlCell';
import ResultStatusCell from './results/ResultStatusCell';

export interface Result {
  url: string;
  businessName?: string;  
  details?: {
    business_name?: string;
    website_url?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    address?: string;
    placeId?: string;
    businessType?: string;
    title?: string;
    description?: string;
    dynamic_loading?: boolean;
    chat_elements?: boolean;
    meta_tags?: boolean;
    websockets?: boolean;
  };
  status?: string;
  has_chatbot?: boolean;
  chatbot_solutions?: string[];
  nextPageToken?: string;
  isAnalyzing?: boolean;
  lastChecked?: string;
}

interface ResultsTableProps {
  results: Result[];
  isLoading?: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ 
  results, 
  isLoading,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Chatbot Provider</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            const hasChatbot = result.has_chatbot || 
              (result.details?.chatSolutions && result.details.chatSolutions.length > 0);
            const isResultAnalyzing = !result.status || result.isAnalyzing;
            const websiteUrl = result.details?.website_url || result.url;
            const businessName = getBusinessName(
              websiteUrl,
              result.businessName || result.details?.business_name
            );
            const technologies = isResultAnalyzing ? 'Analyzing...' : formatChatbotProviders(
              result.chatbot_solutions || result.details?.chatSolutions
            );

            return (
              <TableRow key={index} className={isLoading ? 'opacity-50' : ''}>
                <ResultUrlCell url={websiteUrl} />
                <TableCell className="font-medium">
                  {businessName}
                </TableCell>
                <ResultStatusCell 
                  status={formatAnalysisStatus(result.status, isResultAnalyzing)}
                  hasChatbot={hasChatbot}
                  technologies={technologies}
                  lastChecked={result.lastChecked || result.details?.lastChecked}
                  chatSolutions={result.chatbot_solutions || result.details?.chatSolutions}
                  isAnalyzing={isResultAnalyzing}
                />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;

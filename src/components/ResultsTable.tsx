
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ResultUrlCell from './results/ResultUrlCell';
import ResultStatusCell from './results/ResultStatusCell';

export interface Result {
  id?: string; // Add id property for tracking Google Places results
  url: string;
  status?: string;
  details?: {
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    confidence?: number;
    verificationStatus?: string;
  };
  _metadata?: {
    nextPageToken?: string;
    searchId?: string;
  };
}

export interface SearchResultMeta {
  searchId?: string;
  totalResults?: number;
}

interface ResultsTableProps {
  results: Result[];
  onResultUpdate?: (updatedResult: Result) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, onResultUpdate }) => {
  console.log('ResultsTable received results:', results?.length);

  const formatInstalledTechnologies = (result: Result) => {
    if (!result.status) return 'Analyzing...';
    if (result.status.toLowerCase().includes('error')) return result.status;
    if (result.status === 'Processing...' || result.status.includes('analyzing')) return 'Processing...';
    if (result.status === 'Found, analyzing...') return 'Analyzing...';
    
    const chatSolutions = result.details?.chatSolutions || [];
    if (chatSolutions.length === 0) return 'No chatbot detected';
    
    // Return the first detected chatbot as the primary one
    return chatSolutions[0];
  };

  if (!results || results.length === 0) {
    console.log('ResultsTable: No results to display');
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Chatbot Provider</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
              No results to display
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
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
          const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
          const technologies = formatInstalledTechnologies(result);
          
          return (
            <TableRow key={`${result.url}-${index}`}>
              <ResultUrlCell url={result.url} />
              <TableCell>{result.details?.title || 'Loading...'}</TableCell>
              <ResultStatusCell 
                status={result.status}
                hasChatbot={hasChatbot}
                technologies={technologies}
                lastChecked={result.details?.lastChecked}
                chatSolutions={result.details?.chatSolutions}
                confidence={result.details?.confidence}
                verificationStatus={result.details?.verificationStatus}
                onResultUpdate={onResultUpdate ? () => onResultUpdate(result) : undefined}
              />
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ResultsTable;

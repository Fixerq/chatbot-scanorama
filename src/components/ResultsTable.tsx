
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import ResultUrlCell from './results/ResultUrlCell';
import ResultStatusCell from './results/ResultStatusCell';
import { useApolloScraper, ApolloResults } from '@/hooks/useApolloScraper';

export interface Result {
  id?: string; // Add id property for tracking Google Places results
  url: string;
  status?: string;
  details?: {
    title?: string;
    description?: string;
    phone?: string;
    email?: string;
    rating?: number;
    reviewCount?: number;
    businessType?: string;
    location?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    confidence?: number;
    verificationStatus?: string;
  };
  apolloData?: ApolloResults;
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
  const [enrichedResults, setEnrichedResults] = useState<Result[]>(results);
  const { scrapeCompany, isLoading: apolloLoading } = useApolloScraper();
  
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

  const handleEnrichWithApollo = async (result: Result, index: number) => {
    if (!result.details?.title) return;
    
    const apolloData = await scrapeCompany(
      result.details.title,
      result.url,
      result.details.location
    );
    
    if (apolloData && apolloData.contacts.length > 0) {
      const updatedResults = [...enrichedResults];
      updatedResults[index] = {
        ...result,
        apolloData,
        details: {
          ...result.details,
          email: apolloData.contacts[0]?.email || result.details?.email,
        }
      };
      setEnrichedResults(updatedResults);
      
      if (onResultUpdate) {
        onResultUpdate(updatedResults[index]);
      }
    }
  };

  if (!results || results.length === 0) {
    console.log('ResultsTable: No results to display');
    return (
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Website</TableHead>
          <TableHead>Business Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Chatbot Provider</TableHead>
        </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Chatbot Provider</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(enrichedResults.length > 0 ? enrichedResults : results).map((result, index) => {
          const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
          const technologies = formatInstalledTechnologies(result);
          
          return (
            <TableRow key={`${result.url}-${index}`}>
              <ResultUrlCell url={result.url} />
              <TableCell>{result.details?.title || 'Loading...'}</TableCell>
              <TableCell className="text-sm">
                {result.details?.phone || 'Not available'}
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex items-center gap-2">
                  {result.details?.email || result.apolloData?.contacts?.[0]?.email ? (
                    <span>{result.details?.email || result.apolloData?.contacts?.[0]?.email}</span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Not available</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnrichWithApollo(result, index)}
                        disabled={apolloLoading}
                        className="h-6 px-2"
                      >
                        {apolloLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Mail className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {result.details?.location || result.details?.description || 'Not available'}
              </TableCell>
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

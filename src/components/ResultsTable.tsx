
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
  url: string;
  businessName?: string;
  details?: {
    business_name?: string;
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    website_url?: string | null;
    address?: string;
    businessType?: string;
    phoneNumber?: string;
    placeId?: string;
  };
  status?: string;
}

interface ResultsTableProps {
  results: Result[];
}

const extractBusinessNameFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname;
    return domain
      .replace(/^www\.|\.com\.au$|\.au$/, '')
      .split(/[.-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
      .trim();
  } catch {
    return null;
  }
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const formatInstalledTechnologies = (result: Result) => {
    if (!result.status) return 'Analyzing...';
    if (result.status.toLowerCase().includes('error')) return result.status;
    
    const chatSolutions = result.details?.chatSolutions || [];
    if (chatSolutions.length === 0) return 'No chatbot detected';
    
    return chatSolutions[0];
  };

  const getBusinessName = (result: Result): string => {
    // Log the incoming data for debugging
    console.log('Processing business name for result:', {
      url: result.url,
      rawBusinessName: result.businessName,
      detailsBusinessName: result.details?.business_name,
      fullResult: result
    });

    // Try all possible locations of the business name
    const businessName = 
      result.businessName || // Direct property
      result.details?.business_name || // In details
      result.details?.title || // Fallback to title
      extractBusinessNameFromUrl(result.url); // Last resort

    console.log('Resolved business name:', businessName);
    
    return businessName || 'N/A';
  };

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
            console.log('Raw result data:', JSON.stringify(result, null, 2));
            
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            const technologies = formatInstalledTechnologies(result);
            const displayUrl = result.details?.website_url || result.url;
            const businessName = getBusinessName(result);
            
            console.log('Rendering row:', {
              index,
              url: displayUrl,
              businessName,
              hasDetails: !!result.details,
              fullResult: result
            });

            return (
              <TableRow key={index}>
                <ResultUrlCell url={displayUrl} />
                <TableCell className="font-medium">
                  {businessName}
                </TableCell>
                <ResultStatusCell 
                  status={result.status}
                  hasChatbot={hasChatbot}
                  technologies={technologies}
                  lastChecked={result.details?.lastChecked}
                  chatSolutions={result.details?.chatSolutions}
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

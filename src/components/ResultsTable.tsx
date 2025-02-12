
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
  status?: string;
  details?: {
    title?: string;
    description?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    website_url?: string | null;
    business_name?: string | null;
    google_business_name?: string | null;
    placeId?: string;
    address?: string;
    businessType?: string;
    phoneNumber?: string;
  };
}

interface ResultsTableProps {
  results: Result[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const formatInstalledTechnologies = (result: Result) => {
    if (!result.status) return 'Analyzing...';
    if (result.status.toLowerCase().includes('error')) return result.status;
    
    const chatSolutions = result.details?.chatSolutions || [];
    if (chatSolutions.length === 0) return 'No chatbot detected';
    
    // Return the first detected chatbot as the primary one
    return chatSolutions[0];
  };

  const getBusinessName = (result: Result): string => {
    if (!result.details) {
      console.log('No details available for result:', result.url);
      return 'N/A';
    }

    // Use the Google-provided name as the primary source
    const businessName = result.details.google_business_name || 
                        result.details.business_name || 
                        result.details.title || 
                        'N/A';
    
    console.log('Business name components for', result.url, ':', {
      googleBusinessName: result.details.google_business_name,
      businessName: result.details.business_name,
      title: result.details.title,
      finalName: businessName
    });
    
    return businessName;
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
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            const technologies = formatInstalledTechnologies(result);
            const displayUrl = result.details?.website_url || result.url;
            const businessName = getBusinessName(result);
            
            return (
              <TableRow key={index}>
                <ResultUrlCell url={displayUrl} />
                <TableCell>{businessName}</TableCell>
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


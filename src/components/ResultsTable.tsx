
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
    console.log('Processing business name for result:', {
      url: result.url,
      details: result.details
    });

    if (!result.details) {
      console.log('No details available for result');
      return 'N/A';
    }

    // Get business name from details, with detailed logging
    const businessName = result.details.business_name || '';
    const title = result.details.title || '';
    
    console.log('Business name components:', {
      businessName,
      title,
      fullDetails: result.details
    });
    
    // Return the first available value in order of preference
    const name = businessName || title || 'N/A';
    
    console.log('Final business name:', name);
    return name;
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


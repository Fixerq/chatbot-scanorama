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
    website_url?: string;
    lastChecked?: string;
    chatSolutions?: string[];
    address?: string;
    placeId?: string;
    businessType?: string;
    title?: string;
    description?: string;
  };
  status?: string;
}

interface ResultsTableProps {
  results: Result[];
}

const formatBusinessName = (name: string): string => {
  if (!name) return 'N/A';

  // Remove common suffixes
  const cleanName = name.toLowerCase()
    .replace(/\.(com|ca|uk|net)$/g, '')
    .replace(/www\./g, '');

  // Split by common separators
  const words = cleanName
    .split(/(?=[A-Z])|[-_]/)
    .join(' ')
    .split(/(?=[A-Z])/)
    .join(' ')
    .split(/\s+/);

  // Common words to keep lowercase
  const lowercaseWords = ['and', 'of', 'the', '&'];

  // Capitalize each word unless it's in the lowercaseWords array
  const formattedWords = words.map((word, index) => {
    word = word.trim().toLowerCase();
    if (index === 0 || !lowercaseWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });

  return formattedWords.join(' ');
};

const extractNameFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // For Google Maps URLs, extract the business name from the query parameter
    if (url.includes('maps.google.com')) {
      const params = new URL(url).searchParams;
      const q = params.get('q');
      return q ? decodeURIComponent(q) : null;
    }
    
    // For regular URLs, extract from domain
    const domain = new URL(url).hostname
      .replace('www.', '')
      .replace('.com.au', '')
      .replace('.com', '')
      .replace('.au', '')
      .split('.')[0];
      
    return domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : null;
  } catch {
    return null;
  }
};

const getBusinessName = (result: Result): string => {
  // Extract business name from the result
  const name = result.businessName || // Try root level first
               result.details?.business_name || // Then try details
               extractNameFromUrl(result.url); // Fallback to URL extraction

  return formatBusinessName(name);
};

const formatInstalledTechnologies = (result: Result) => {
  if (!result.status) return 'Analyzing...';
  if (result.status.toLowerCase().includes('error')) return result.status;
  
  const chatSolutions = result.details?.chatSolutions || [];
  if (chatSolutions.length === 0) return 'No chatbot detected';
  
  return chatSolutions[0];
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
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
            const businessName = getBusinessName(result);
            
            console.log('Rendering row:', {
              index,
              url: result.url,
              businessName,
              hasDetails: !!result.details,
              fullResult: result
            });

            return (
              <TableRow key={index}>
                <ResultUrlCell url={result.url} />
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

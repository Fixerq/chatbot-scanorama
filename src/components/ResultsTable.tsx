
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
  nextPageToken?: string;
}

interface ResultsTableProps {
  results: Result[];
  isLoading?: boolean;
}

const formatBusinessName = (name: string): string => {
  if (!name) return 'N/A';

  const cleanName = name.toLowerCase()
    .replace(/\.(com|ca|uk|net|org|co|io|au)$/g, '')
    .replace(/www\./g, '')
    .replace(/^(http:\/\/|https:\/\/)/, '');

  const withoutIdentifiers = cleanName
    .replace(/(ltd|llc|inc|corporation|corp|pty|limited)\.?\s*$/i, '')
    .trim();

  const words = withoutIdentifiers
    .split(/[\s_\-]+/)
    .filter(word => word.length > 0);

  const lowercaseWords = ['and', 'of', 'the', '&', 'in', 'on', 'at', 'by', 'for', 'to'];

  const formattedWords = words.map((word, index) => {
    word = word.trim().toLowerCase();
    if (index === 0 || !lowercaseWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });

  return formattedWords.join(' ');
};

const getBusinessName = (result: Result): string => {
  const name = result.businessName || 
               result.details?.business_name || 
               extractNameFromUrl(result.url);
               
  return formatBusinessName(name || '');
};

const extractNameFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    if (url.includes('maps.google.com')) {
      const params = new URL(url).searchParams;
      const q = params.get('q');
      return q ? decodeURIComponent(q) : null;
    }
    
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

const formatInstalledTechnologies = (result: Result) => {
  if (!result.status) return 'Analyzing...';
  if (result.status.toLowerCase().includes('error')) return result.status;
  
  const chatSolutions = result.details?.chatSolutions || [];
  if (chatSolutions.length === 0) return 'No chatbot detected';
  
  return chatSolutions[0];
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results, isLoading }) => {
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
            const isAnalyzing = !result.status;
            const technologies = isAnalyzing ? 'Analyzing...' : formatInstalledTechnologies(result);
            const businessName = getBusinessName(result);
            const websiteUrl = result.details?.website_url || result.url;

            return (
              <TableRow key={index} className={isLoading ? 'opacity-50' : ''}>
                <ResultUrlCell url={websiteUrl} />
                <TableCell className="font-medium">
                  {businessName}
                </TableCell>
                <ResultStatusCell 
                  status={result.status}
                  hasChatbot={hasChatbot}
                  technologies={technologies}
                  lastChecked={result.details?.lastChecked}
                  chatSolutions={result.details?.chatSolutions}
                  isAnalyzing={isAnalyzing}
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

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
    
    return chatSolutions.join(', ');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Website</TableHead>
            <TableHead>Business Name</TableHead>
            <TableHead>Installed Technologies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            const hasChatbot = result.details?.chatSolutions && result.details.chatSolutions.length > 0;
            const technologies = formatInstalledTechnologies(result);
            
            return (
              <TableRow key={index}>
                <ResultUrlCell url={result.url} />
                <TableCell>{result.details?.title || 'N/A'}</TableCell>
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
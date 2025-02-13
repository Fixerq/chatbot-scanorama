
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';

interface ResultStatusCellProps {
  status?: string;
  hasChatbot?: boolean;
  technologies: string;
  lastChecked?: string;
  chatSolutions?: string[];
  isAnalyzing?: boolean;
}

const ResultStatusCell: React.FC<ResultStatusCellProps> = ({
  status,
  hasChatbot,
  technologies,
  lastChecked,
  chatSolutions,
  isAnalyzing
}) => {
  if (isAnalyzing) {
    return (
      <TableCell>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">Analyzing...</span>
        </div>
      </TableCell>
    );
  }

  if (status?.toLowerCase().includes('error')) {
    return (
      <TableCell>
        <div className="text-red-500 dark:text-red-400">
          {status}
          {lastChecked && (
            <div className="text-xs text-gray-500 mt-1">
              Last attempt: {new Date(lastChecked).toLocaleString()}
            </div>
          )}
        </div>
      </TableCell>
    );
  }

  return (
    <TableCell>
      <div className="space-y-1">
        <div className={`${hasChatbot ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
          {technologies}
          {chatSolutions && chatSolutions.length > 0 && (
            <div className="text-xs text-green-500 dark:text-green-400 mt-0.5">
              {chatSolutions.join(', ')}
            </div>
          )}
        </div>
        {lastChecked && (
          <div className="text-xs text-gray-500">
            Last checked: {new Date(lastChecked).toLocaleString()}
          </div>
        )}
      </div>
    </TableCell>
  );
};

export default ResultStatusCell;

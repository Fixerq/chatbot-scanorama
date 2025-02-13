
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
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analyzing...</span>
        </div>
      </TableCell>
    );
  }

  if (status?.toLowerCase().includes('error')) {
    return (
      <TableCell className="text-red-500">
        {status}
      </TableCell>
    );
  }

  return (
    <TableCell>
      <div className="space-y-1">
        <div className={hasChatbot ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
          {technologies}
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


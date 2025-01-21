import React from 'react';
import { TableCell } from "@/components/ui/table";
import { formatUrl } from '@/utils/urlFormatting';

interface ResultUrlCellProps {
  url: string;
}

const ResultUrlCell = ({ url }: ResultUrlCellProps) => {
  const { displayUrl, fullUrl } = formatUrl(url);

  return (
    <TableCell className="font-medium">
      {url ? (
        <a 
          href={fullUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {displayUrl}
        </a>
      ) : (
        <span className="text-gray-500">N/A</span>
      )}
    </TableCell>
  );
};

export default ResultUrlCell;
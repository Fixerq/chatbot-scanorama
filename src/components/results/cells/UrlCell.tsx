
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { formatUrl } from '@/utils/urlFormatting';

interface UrlCellProps {
  url: string;
}

const UrlCell = ({ url }: UrlCellProps) => {
  const { displayUrl } = formatUrl(url);
  
  return (
    <TableCell>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
      >
        {displayUrl}
      </a>
    </TableCell>
  );
};

export default UrlCell;

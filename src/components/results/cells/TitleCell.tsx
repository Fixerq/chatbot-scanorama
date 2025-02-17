
import React from 'react';
import { TableCell } from "@/components/ui/table";

interface TitleCellProps {
  title: string;
}

const TitleCell = ({ title }: TitleCellProps) => {
  return (
    <TableCell className="font-medium">
      {title}
    </TableCell>
  );
};

export default TitleCell;

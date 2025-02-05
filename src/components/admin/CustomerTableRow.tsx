import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomerData } from '@/types/admin';
import { CustomerActions } from './CustomerActions';

interface CustomerTableRowProps {
  customer: CustomerData;
  onCustomerUpdate: () => void;
}

export const CustomerTableRow = ({ customer, onCustomerUpdate }: CustomerTableRowProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatSearches = (remaining: number, total: number) => {
    if (total === -1) {
      return '∞';
    }
    return `${remaining} / ${total}`;
  };

  return (
    <TableRow>
      <TableCell>{customer.email}</TableCell>
      <TableCell className="capitalize">{customer.subscription.level || 'starter'}</TableCell>
      <TableCell>
        <Badge 
          variant={customer.subscription.status === 'active' ? 'default' : 'secondary'}
        >
          {customer.subscription.status}
        </Badge>
      </TableCell>
      <TableCell>
        {formatSearches(customer.searchesRemaining, customer.totalSearches)}
      </TableCell>
      <TableCell>
        {customer.subscription.current_period_end 
          ? formatDate(customer.subscription.current_period_end)
          : 'N/A'}
      </TableCell>
      <TableCell>
        <CustomerActions 
          userId={customer.profile.id}
          totalSearches={customer.totalSearches}
          onCustomerUpdate={onCustomerUpdate}
        />
      </TableCell>
    </TableRow>
  );
};
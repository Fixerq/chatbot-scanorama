import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerData } from '@/types/admin';
import { LoadingState } from './LoadingState';
import { CustomerTableRow } from './CustomerTableRow';

interface CustomerTableProps {
  customers: CustomerData[];
  onCustomerUpdate: () => void;
  isLoading: boolean;
}

export const CustomerTable = ({ customers, onCustomerUpdate, isLoading }: CustomerTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Searches</TableHead>
            <TableHead>Subscription End</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <CustomerTableRow
              key={customer.profile.id}
              customer={customer}
              onCustomerUpdate={onCustomerUpdate}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
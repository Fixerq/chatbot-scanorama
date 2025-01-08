import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useRecentSearches } from './useRecentSearches';

interface RecentSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecentSearchDialog = ({ open, onOpenChange }: RecentSearchDialogProps) => {
  const { recentSearches, isLoading, formatDate, getStatusBadgeColor } = useRecentSearches();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Recent Searches</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {recentSearches.map((search) => (
              <div
                key={search.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">
                      {search.details?.title || search.url}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {search.details?.description || 'No description available'}
                    </p>
                  </div>
                  <a
                    href={search.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <Badge variant={getStatusBadgeColor(search.status)}>
                    {search.status}
                  </Badge>
                  <span>{formatDate(search.created_at)}</span>
                </div>
              </div>
            ))}
            {recentSearches.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-8">
                No recent searches found
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
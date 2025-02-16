
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

interface CrawlRecord {
  id: string;
  url: string;
  status: string;
  result: CrawlResult | null;
  error?: string;
  user_id?: string;
  started_at: string;
  completed_at?: string;
  analyzed?: boolean;
}

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [crawlRecords, setCrawlRecords] = useState<CrawlRecord[]>([]);

  useEffect(() => {
    // Fetch existing crawl records when component mounts
    const fetchCrawlRecords = async () => {
      const { data, error } = await supabase
        .from('crawl_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching crawl records:', error);
        return;
      }

      if (data) {
        // Transform the data to match CrawlRecord type
        const transformedData: CrawlRecord[] = data.map(record => ({
          ...record,
          result: record.result as CrawlResult | null // Type assertion since we know the structure
        }));
        setCrawlRecords(transformedData);
      }
    };

    fetchCrawlRecords();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('crawl_results_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crawl_results'
        },
        (payload) => {
          console.log('Crawl results update:', payload);
          if (payload.new) {
            setCrawlRecords(prevRecords => {
              const newRecord = {
                ...payload.new,
                result: payload.new.result as CrawlResult | null
              } as CrawlRecord;
              
              const existingIndex = prevRecords.findIndex(r => r.id === newRecord.id);
              
              if (existingIndex >= 0) {
                // Update existing record
                const updatedRecords = [...prevRecords];
                updatedRecords[existingIndex] = newRecord;
                return updatedRecords;
              } else {
                // Add new record
                return [newRecord, ...prevRecords];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    
    try {
      console.log('Starting crawl for URL:', url);
      const { data, error } = await supabase.functions.invoke('crawl-website', {
        body: { url }
      });

      if (error) {
        console.error('Crawl error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to crawl website",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Website crawl initiated",
          duration: 3000,
        });

        if (data.result) {
          setCrawlResult(data.result as CrawlResult);
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to crawl website",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Website URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              placeholder="https://example.com"
              required
            />
          </div>
          {isLoading && (
            <Progress value={progress} className="w-full" />
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crawling...</span>
              </div>
            ) : (
              "Start Crawl"
            )}
          </Button>
        </form>
      </div>

      {crawlResult && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Current Crawl Status</h3>
          <div className="space-y-2 text-sm">
            <p>Status: {crawlResult.status}</p>
            {crawlResult.completed !== undefined && (
              <p>Completed Pages: {crawlResult.completed}</p>
            )}
            {crawlResult.total !== undefined && (
              <p>Total Pages: {crawlResult.total}</p>
            )}
            {crawlResult.creditsUsed !== undefined && (
              <p>Credits Used: {crawlResult.creditsUsed}</p>
            )}
          </div>
        </Card>
      )}

      {crawlRecords.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Crawl Results</h3>
          <Table>
            <TableCaption>A list of your recent website crawls</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Analysis Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crawlRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.url}</TableCell>
                  <TableCell>{record.status}</TableCell>
                  <TableCell>{new Date(record.started_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {record.completed_at ? new Date(record.completed_at).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {record.analyzed ? 'Analyzed' : 'Pending Analysis'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};


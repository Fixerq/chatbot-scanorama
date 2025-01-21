import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookmarkButton from '../BookmarkButton';
import { Result } from '../ResultsTable';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface ResultsHeaderProps {
  results: Result[];
  totalCount: number;
  chatbotCount: number;
  onNewSearch: () => void;
  onExport: () => void;
}

const ResultsHeader = ({ 
  results, 
  totalCount, 
  chatbotCount, 
  onNewSearch, 
  onExport 
}: ResultsHeaderProps) => {
  const handleExport = () => {
    try {
      // Transform results into a format suitable for CSV
      const csvData = results.map(result => ({
        URL: result.url,
        'Business Name': result.details?.title || 'N/A',
        'Technologies': result.details?.chatSolutions?.join(', ') || 'No chatbot detected',
        'Last Checked': result.details?.lastChecked ? new Date(result.details.lastChecked).toLocaleString() : 'N/A',
        Status: result.status || 'N/A'
      }));

      // Convert to CSV
      const csv = Papa.unparse(csvData);
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `detectify-results-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-sm text-cyan-200/70">
          Found {totalCount} website{totalCount !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-cyan-300/60">
          {chatbotCount} sites with chatbots detected
        </p>
      </div>
      <div className="space-x-3">
        <BookmarkButton results={results} />
        <Button 
          variant="outline" 
          onClick={onNewSearch}
          className="border-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20 rounded-full transition-all duration-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          New Search
        </Button>
        <Button 
          onClick={handleExport}
          className="bg-cyan-500 text-black hover:bg-cyan-400 glow rounded-full transition-all duration-300"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </Button>
      </div>
    </div>
  );
};

export default ResultsHeader;
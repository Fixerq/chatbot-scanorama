import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import { Result } from '@/components/ResultsTable';
import { processCSV, exportToCSV } from '@/utils/chatbotDetection';
import { toast } from 'sonner';
import CsvInstructions from '@/components/CsvInstructions';
import Header from '@/components/Header';
import Results from '@/components/Results';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = async (content: string) => {
    setIsProcessing(true);
    const urls = processCSV(content);
    
    if (urls.length === 0) {
      toast.error('No valid URLs found in the CSV');
      setIsProcessing(false);
      return;
    }

    if (urls.length > 100) {
      toast.error('Please limit your CSV to 100 URLs or less');
      setIsProcessing(false);
      return;
    }

    try {
      const newResults = await Promise.all(
        urls.map(async (url) => ({
          url,
          status: 'Processing...' // Placeholder for actual detection logic
        }))
      );
      
      setResults(newResults);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Error processing URLs');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }
    exportToCSV(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header />
        
        <div className="space-y-8 animate-fade-in">
          <CsvInstructions />
          <FileUpload onFileAccepted={handleFileAccepted} />
          
          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-gray-600">Analyzing URLs...</p>
            </div>
          )}

          {results.length > 0 && !isProcessing && (
            <Results results={results} onExport={handleExport} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
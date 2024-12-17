import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsTable, { Result } from '@/components/ResultsTable';
import { Button } from '@/components/ui/button';
import { detectChatbot, processCSV, exportToCSV } from '@/utils/chatbotDetection';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import CsvInstructions from '@/components/CsvInstructions';

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
          status: await detectChatbot(url)
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/engage-logo.png" 
            alt="EngageAI Logo" 
            className="h-16 w-auto"
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">EngageAI Chatbot Detection App</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover integrated chatbot platforms across your web properties with our advanced detection tool. 
          Simply upload a CSV file with your URLs, and we'll identify popular platforms like Drift, Intercom, 
          HubSpot, and more. Perfect for digital marketers and web administrators looking to analyze their 
          customer engagement tools.
        </p>
      </div>

      <div className="space-y-8">
        <CsvInstructions />
        
        <FileUpload onFileAccepted={handleFileAccepted} />
        
        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">Analyzing URLs...</p>
          </div>
        )}

        {results.length > 0 && !isProcessing && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>
            <ResultsTable results={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
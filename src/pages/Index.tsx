import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import { Result } from '@/components/ResultsTable';
import { processCSV, exportToCSV, detectChatbot } from '@/utils/chatbotDetection';
import { toast } from 'sonner';
import CsvInstructions from '@/components/CsvInstructions';
import Header from '@/components/Header';
import Results from '@/components/Results';
import SearchFormContainer from '@/components/SearchFormContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      const initialResults = urls.map(url => ({
        url,
        status: 'Processing...'
      }));
      setResults(initialResults);

      // Process URLs in parallel with a concurrency limit
      const concurrencyLimit = 10; // Increased from 5 to 10 for faster processing
      const chunks = [];
      for (let i = 0; i < urls.length; i += concurrencyLimit) {
        chunks.push(urls.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (url) => {
          try {
            const status = await detectChatbot(url);
            setResults(prev => prev.map(result => 
              result.url === url ? { ...result, status } : result
            ));
          } catch (error) {
            console.error(`Error processing ${url}:`, error);
            setResults(prev => prev.map(result => 
              result.url === url ? { ...result, status: 'Error analyzing URL' } : result
            ));
          }
        }));
      }

      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error processing URLs:', error);
      toast.error('Error processing URLs');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSearch = () => {
    setResults([]);
    toast.success('Ready for a new search');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header />
        
        <div className="space-y-8 animate-fade-in">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="search">Search Websites</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-8">
              <CsvInstructions />
              <FileUpload onFileAccepted={handleFileAccepted} />
            </TabsContent>
            
            <TabsContent value="search" className="space-y-8">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Search Websites by Niche</h3>
                <p>Enter a niche or industry to find and analyze websites for chatbot usage. The search will return up to 100 relevant websites.</p>
              </div>
              <SearchFormContainer onResults={setResults} isProcessing={isProcessing} />
            </TabsContent>
          </Tabs>
          
          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-gray-600">Analyzing URLs...</p>
            </div>
          )}

          {results.length > 0 && (
            <Results 
              results={results} 
              onExport={() => exportToCSV(results)}
              onNewSearch={handleNewSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApolloContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  phone?: string;
}

export interface ApolloCompanyInfo {
  name?: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone?: string;
  address?: string;
}

export interface ApolloResults {
  contacts: ApolloContact[];
  companyInfo?: ApolloCompanyInfo;
}

export const useApolloScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApolloResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrapeCompany = async (
    companyName: string,
    domain?: string,
    location?: string
  ): Promise<ApolloResults | null> => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Starting Apollo scraper for:', companyName);
      
      const { data, error: functionError } = await supabase.functions.invoke('apify-apollo-scraper', {
        body: {
          companyName,
          domain,
          location,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const apolloResults: ApolloResults = {
        contacts: data?.contacts || [],
        companyInfo: data?.companyInfo,
      };

      setResults(apolloResults);
      
      if (apolloResults.contacts.length === 0) {
        toast.info(`No contacts found for ${companyName}`);
      } else {
        toast.success(`Found ${apolloResults.contacts.length} contacts for ${companyName}`);
      }

      return apolloResults;
    } catch (err) {
      console.error('Apollo scraper error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape company data';
      setError(errorMessage);
      toast.error(`Apollo scraper failed: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    scrapeCompany,
    clearResults,
    isLoading,
    results,
    error,
  };
};
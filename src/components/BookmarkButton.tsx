
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Result } from './ResultsTable';

interface BookmarkButtonProps {
  results: Result[];
}

const BookmarkButton = ({ results }: BookmarkButtonProps) => {
  const { toast } = useToast();

  const handleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark results",
        variant: "destructive"
      });
      return;
    }

    const jsonResults = results.map(result => ({
      url: result.url,
      status: result.status,
      details: {
        business_name: result.details?.business_name,
        description: result.details?.description,
        lastChecked: result.details?.lastChecked,
        chatSolutions: result.details?.chatSolutions
      }
    }));

    try {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        name: `Search Results - ${new Date().toLocaleDateString()}`,
        description: `Saved ${results.length} results`,
        snapshot: { results: jsonResults }
      } as any);

      if (error) throw error;

      toast({
        title: "Bookmarked!",
        description: "Your results have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to save bookmark. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handleBookmark}
      variant="outline"
      className="group hover:border-blue-500 transition-all duration-300 hover:scale-105"
    >
      <Bookmark className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" />
      <span className="group-hover:text-blue-500 transition-colors">Bookmark</span>
    </Button>
  );
};

export default BookmarkButton;

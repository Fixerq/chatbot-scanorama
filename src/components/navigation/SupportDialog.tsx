
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import { Loader2, HelpCircle } from 'lucide-react';

export interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupportFormValues {
  message: string;
}

export const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<SupportFormValues>({
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: SupportFormValues) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          message: data.message,
          userEmail: user?.email,
        },
      });

      if (error) throw error;
      
      onOpenChange(false);
      form.reset();
      toast.success('Support message sent successfully');
    } catch (error) {
      console.error('Failed to send support message:', error);
      toast.error('Failed to send support message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-slate-200 hover:text-cyan-400 hover:bg-transparent p-2"
        onClick={() => onOpenChange(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Send us a message and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message here..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

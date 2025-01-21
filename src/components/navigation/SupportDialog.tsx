import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupportFormValues {
  message: string;
}

export const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const form = useForm<SupportFormValues>({
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: SupportFormValues) => {
    try {
      // Send email using mailto
      const mailtoLink = `mailto:support@engageaipro.com?body=${encodeURIComponent(data.message)}`;
      window.open(mailtoLink, '_blank');
      
      // Close dialog and show success message
      onOpenChange(false);
      form.reset();
      toast.success('Support message sent successfully');
    } catch (error) {
      toast.error('Failed to send support message');
    }
  };

  return (
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
              <Button type="submit">Send Message</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
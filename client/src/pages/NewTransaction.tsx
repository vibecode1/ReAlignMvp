import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Plus, X } from 'lucide-react';
import { DEFAULT_WELCOME_EMAIL_TEMPLATE } from '@/lib/trackerNoteOptions';
import { useToast } from '@/hooks/use-toast';

// Transaction creation schema for Tracker MVP
const CreateTransactionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  property_address: z.string().min(1, "Property address is required"),
  parties: z.array(z.object({
    email: z.string().email("Valid email is required"),
    role: z.string().min(1, "Role is required"),
  })).optional(),
  welcome_email_body: z.string().optional(),
});

type CreateTransactionForm = z.infer<typeof CreateTransactionSchema>;

export default function NewTransaction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateTransactionForm>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      title: '',
      property_address: '',
      parties: [{ email: '', role: '' }],
      welcome_email_body: DEFAULT_WELCOME_EMAIL_TEMPLATE,
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: CreateTransactionForm) => {
      const response = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create transaction');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Created",
        description: "Your transaction has been successfully created and parties have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/transactions'] });
      setLocation(`/transactions/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTransactionForm) => {
    createTransactionMutation.mutate(data);
  };

  const addParty = () => {
    const currentParties = form.getValues('parties') || [];
    form.setValue('parties', [...currentParties, { email: '', role: '' }]);
  };

  const removeParty = (index: number) => {
    const currentParties = form.getValues('parties') || [];
    form.setValue('parties', currentParties.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Transaction</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Set up a new short sale transaction with automated tracking and email notifications.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Transaction Information */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Basic information about the short sale transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Smith Property Short Sale" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="property_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 123 Main St, City, State 12345" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Email Subscription Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Email Subscribers</CardTitle>
              <CardDescription>
                Add parties who will receive weekly tracker updates and have view-only access to the transaction status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch('parties')?.map((party, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`parties.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="email@example.com" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`parties.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Agent, Homeowner, Attorney" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {form.watch('parties')?.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeParty(index)}
                      className="mb-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addParty}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Party
              </Button>
            </CardContent>
          </Card>

          {/* Welcome Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome Email Configuration</CardTitle>
              <CardDescription>
                Customize the welcome message that will be sent to all subscribed parties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="welcome_email_body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter custom welcome message..."
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be included in the welcome email sent to all subscribed parties with their secure access link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
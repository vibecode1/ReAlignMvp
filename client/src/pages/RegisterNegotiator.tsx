import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Validation schema for registration form
const formSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

const RegisterNegotiator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Set up form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      console.log('Submitting registration data:', { 
        name: data.name, 
        email: data.email, 
        password: '********' // Password masked for security
      });
      
      // Call the API to register a new negotiator
      const response = await apiRequest('POST', '/api/v1/auth/register-negotiator', {
        name: data.name,
        email: data.email,
        password: data.password
      });
      
      console.log('Registration API response:', response);

      // Store user data and token in localStorage
      localStorage.setItem('realign_token', response.token);
      localStorage.setItem('realign_user', JSON.stringify(response.user));
      console.log('Token and user set in localStorage');
      
      // Explicitly set Supabase session
      if (response.token) {
        await supabase.auth.setSession({
          access_token: response.token,
          refresh_token: response.refresh_token || ''
        });
        console.log('Supabase session explicitly set after registration');
      }
      
      // Show success toast
      toast({
        title: 'Registration Successful',
        description: 'Welcome to ReAlign! Your 30-day trial has started.',
      });
      
      console.log('About to redirect to dashboard...');
      
      // Debug user authentication status before redirect
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Supabase session before redirect:', session ? 'Session exists' : 'No session');
        
        // Check if we can access user data
        if (response.user) {
          console.log('User data is available before redirect:', response.user.id);
        }
      } catch (sessionError) {
        console.error('Error checking session before redirect:', sessionError);
      }
      
      // Redirect to dashboard
      console.log('Executing setLocation(\'/dashboard\')');
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Display appropriate error message based on error code
      const errorMessage = error.error?.code === 'EMAIL_EXISTS' 
        ? 'This email is already registered. Please use a different email or login instead.'
        : 'Failed to register. Please try again later.';
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/realign-logo.png" alt="ReAlign Logo" className="h-10" />
            </div>
            <CardTitle className="text-2xl text-center">Negotiator Registration</CardTitle>
            <CardDescription className="text-center">
              Register as a Negotiator for a 30-day full access trial. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          autoComplete="name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          type="email" 
                          autoComplete="email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Create a password" 
                          type="password" 
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Confirm your password" 
                          type="password" 
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login">
                <a className="text-brand-primary hover:underline font-medium">
                  Login here
                </a>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterNegotiator;
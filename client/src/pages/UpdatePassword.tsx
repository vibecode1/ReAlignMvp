import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from '@/lib/supabase';

// Form validation schema
const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePassword() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Handle the auth callback from the email link
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
          return;
        }
        
        if (!data.session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('Failed to process reset link. Please try again.');
      }
    };

    handleAuthCallback();
  }, []);

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Logo className="mx-auto" />
        </div>

        <motion.div 
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Password Updated!</CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been successfully updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full"
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Logo className="mx-auto" />
      </div>

      <motion.div 
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl">Update Your Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your new password" 
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
                          placeholder="Confirm your new password" 
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

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>

                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/login")}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
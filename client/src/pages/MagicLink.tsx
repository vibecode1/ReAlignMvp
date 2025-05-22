import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export default function MagicLink() {
  const [, navigate] = useLocation();
  const { requestMagicLink, isLoading } = useAuth();
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [currentEmail, setCurrentEmail] = useState("");
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  const form = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  // Reset error message when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (errorMessage) {
        setErrorMessage(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, errorMessage]);

  const onSubmit = async (data: MagicLinkFormValues) => {
    try {
      setErrorMessage(null);
      
      // Store email for potential resends
      setCurrentEmail(data.email);
      
      // Check if max attempts reached
      if (requestCount >= 3) {
        setMaxAttemptsReached(true);
        setErrorMessage("You have exceeded the maximum number of request attempts. Please try again later.");
        return;
      }
      
      setRequestCount(prevCount => prevCount + 1);
      await requestMagicLink(data.email);
      setMagicLinkSent(true);
    } catch (error) {
      setErrorMessage("Failed to send magic link. Please try again.");
    }
  };
  
  const handleResendMagicLink = async () => {
    try {
      // Check if max attempts reached
      if (requestCount >= 3) {
        setMaxAttemptsReached(true);
        setErrorMessage("You have exceeded the maximum number of resend attempts. Please try again later.");
        return;
      }
      
      setRequestCount(prevCount => prevCount + 1);
      setErrorMessage(null);
      
      // Call resend endpoint instead of regular magic link
      await apiRequest('POST', '/api/v1/auth/magic-link/resend', { email: currentEmail });
      
      // Show toast or update UI to indicate resend was successful
      setMagicLinkSent(true);
    } catch (error) {
      setErrorMessage("Failed to resend magic link. Please try again later.");
    }
  };

  const handleBack = () => {
    navigate("/login");
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
              <img src="/images/logo.png" alt="ReAlign Logo" className="h-12" />
            </div>
            <CardTitle className="text-2xl text-center">Magic Link Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive a secure sign-in link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {magicLinkSent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Check your email</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a magic link to your email. Click the link to sign in.
                  The link will expire in 24 hours.
                </p>
                <Button
                  variant="outline" 
                  className="mt-2"
                  onClick={handleResendMagicLink}
                  disabled={maxAttemptsReached || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Another Link'
                  )}
                </Button>
                
                {maxAttemptsReached && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 text-amber-700 rounded-md text-sm">
                    <AlertCircle className="h-4 w-4 inline-block mr-1" />
                    Maximum attempts reached. Please try again later.
                  </div>
                )}
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                      {errorMessage}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={handleBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

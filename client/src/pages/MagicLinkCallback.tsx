import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MagicLinkCallback() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'invalid'>('loading');
  const [requestCount, setRequestCount] = useState(0);
  const [email, setEmail] = useState<string>('');

  // Get URL hash for the magic link token
  useEffect(() => {
    const processHash = async () => {
      try {
        // Extract the token from the URL hash
        const hash = window.location.hash;
        
        if (!hash) {
          setStatus('invalid');
          return;
        }
        
        // Process the magic link with Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error processing magic link:', error);
          setStatus('invalid');
          return;
        }
        
        // If we have a session, it means the magic link was valid
        if (data.session) {
          // Try to get user info from our API
          try {
            const userData = await apiRequest('GET', '/api/v1/auth/me');
            const userInfo = await userData.json();
            
            setStatus('success');
            
            // After a short delay, redirect to dashboard
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } catch (apiError) {
            console.error('Failed to get user info:', apiError);
            setStatus('invalid');
          }
        } else {
          // No session means the link is expired or invalid
          setStatus('expired');
          
          // Try to extract email from hash for resend functionality
          try {
            // typical format is #access_token=...&refresh_token=...&type=...&email=...
            const params = new URLSearchParams(hash.substring(1));
            const extractedEmail = params.get('email');
            if (extractedEmail) {
              setEmail(extractedEmail);
            }
          } catch (e) {
            console.error('Failed to extract email from hash:', e);
          }
        }
      } catch (error) {
        console.error('Error processing magic link:', error);
        setStatus('invalid');
      }
    };
    
    processHash();
  }, [navigate]);
  
  const handleResendMagicLink = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Unable to determine your email. Please return to the login page.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if we've exceeded resend attempts
      if (requestCount >= 3) {
        toast({
          title: "Maximum Attempts Exceeded",
          description: "You have exceeded the maximum number of resend attempts. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      setRequestCount(prev => prev + 1);
      
      // Call the resend endpoint
      await apiRequest('POST', '/api/v1/auth/magic-link/resend', { email });
      
      toast({
        title: "Magic Link Sent",
        description: "Please check your email for a new login link.",
      });
    } catch (error) {
      console.error('Failed to resend magic link:', error);
      toast({
        title: "Failed to Resend",
        description: "There was a problem sending a new magic link. Please try again later.",
        variant: "destructive",
      });
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
              <div className="text-2xl font-bold text-brand-primary">ReAlign</div>
            </div>
            <CardTitle className="text-2xl text-center">
              {status === 'loading' && 'Verifying Magic Link'}
              {status === 'success' && 'Login Successful'}
              {status === 'expired' && 'Magic Link Expired'}
              {status === 'invalid' && 'Invalid Magic Link'}
            </CardTitle>
            <CardDescription className="text-center">
              {status === 'loading' && 'Please wait while we verify your login...'}
              {status === 'success' && 'You will be redirected to your dashboard.'}
              {status === 'expired' && 'This magic link has expired. Please request a new one.'}
              {status === 'invalid' && 'This magic link is invalid. Please return to login.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4 pb-6">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 animate-spin text-brand-primary" />
            )}
            
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            
            {(status === 'expired' || status === 'invalid') && (
              <AlertCircle className="h-16 w-16 text-red-500" />
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {status === 'loading' && (
              <p className="text-sm text-gray-500">This may take a moment...</p>
            )}
            
            {status === 'expired' && (
              <div className="space-y-2 w-full">
                <Button 
                  onClick={handleResendMagicLink} 
                  className="w-full"
                >
                  Send New Magic Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')} 
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            )}
            
            {status === 'invalid' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
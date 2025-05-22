import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useClearAuth } from '@/hooks/use-clear-auth';

export default function ClearState() {
  const [cleared, setCleared] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearAllAuthData } = useClearAuth();

  // Function to clear all client-side state
  const clearAllState = async () => {
    try {
      // Use the dedicated auth clearing function
      await clearAllAuthData();
      
      // Clear any other localStorage and sessionStorage items that might be left
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies related to authentication
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
      
      setCleared(true);
      
      toast({
        title: "Success!",
        description: "All local storage has been cleared. You can now return to login.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error clearing state:', error);
      toast({
        title: "Error",
        description: "There was a problem clearing your local storage.",
        variant: "destructive"
      });
    }
  };

  const goToLogin = () => {
    setLocation('/login');
  };

  const goToRegister = () => {
    setLocation('/register-negotiator');
  };

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Card className="w-[400px] max-w-[90vw]">
        <CardHeader>
          <CardTitle>Clear Application State</CardTitle>
          <CardDescription>
            Use this tool to clear all stored application state and fix login issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm">
            This will clear all locally stored data including:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
            <li>Authentication tokens</li>
            <li>User information</li>
            <li>Session data</li>
            <li>Cookies</li>
          </ul>
          <p className="text-sm text-gray-500 italic">
            After clearing, you will need to log in again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={clearAllState} variant="destructive" className="w-full" disabled={cleared}>
            {cleared ? "State Cleared" : "Clear All State"}
          </Button>
          <div className="flex gap-2 w-full">
            <Button onClick={goToLogin} variant="outline" className="flex-1">
              Go to Login
            </Button>
            <Button onClick={goToRegister} variant="default" className="flex-1">
              Register
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
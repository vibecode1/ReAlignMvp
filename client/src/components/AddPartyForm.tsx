import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AddPartyFormProps {
  transactionId: string;
  onSuccess: (data: any) => void;
  isLoading?: boolean;
}

export default function AddPartyForm({ transactionId, onSuccess, isLoading = false }: AddPartyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      // Instead of making the API call directly, pass the data to the parent component
      const partyData = {
        name,
        email,
        role
      };

      onSuccess(partyData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    
      
        
          <Plus className="h-4 w-4" />
          Add Party
        
      

      
        
          
            Add Party to Transaction
            
              Add a new party to this transaction. They will receive an email notification with a link to track the transaction progress.
            
          

          
            
              
                Name
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter party's full name"
                  disabled={isLoading}
                />
              
            

            
              
                Email
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter party's email address"
                  disabled={isLoading}
                />
              
            

            
              
                Role
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  
                    
                      Select party's role
                    
                  
                  
                    Seller
                  
                  
                    Buyer
                  
                  
                    Listing Agent
                  
                  
                    Buyer's Agent
                  
                  
                    Escrow
                  
                </Select>
              
            
          

          
            
              Cancel
            
            <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Adding..." : "Add Party"}
      </Button>
          
          {formError && (
        <p className="text-red-500 text-sm mt-2">{formError}</p>
      )}
        
      
    
  );
}
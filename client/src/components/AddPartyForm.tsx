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
}

export function AddPartyForm({ transactionId }: AddPartyFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addPartyMutation = useMutation({
    mutationFn: async (partyData: { name: string; email: string; role: string }) => {
      return apiRequest('POST', `/api/v1/transactions/${transactionId}/parties`, partyData);
    },
    onSuccess: () => {
      toast({
        title: "Party Added Successfully",
        description: "The party has been added to the transaction and will receive an email notification.",
      });
      
      // Reset form
      setName('');
      setEmail('');
      setRole('');
      setOpen(false);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/v1/transactions', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/transactions', transactionId, 'parties'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Party",
        description: error.message || "An error occurred while adding the party to the transaction.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before adding the party.",
        variant: "destructive",
      });
      return;
    }

    addPartyMutation.mutate({ name: name.trim(), email: email.trim(), role });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Party to Transaction</DialogTitle>
            <DialogDescription>
              Add a new party to this transaction. They will receive an email notification with a link to track the transaction progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter party's full name"
                disabled={addPartyMutation.isPending}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter party's email address"
                disabled={addPartyMutation.isPending}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={addPartyMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select party's role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="listing_agent">Listing Agent</SelectItem>
                  <SelectItem value="buyers_agent">Buyer's Agent</SelectItem>
                  <SelectItem value="escrow">Escrow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addPartyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addPartyMutation.isPending}
            >
              {addPartyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Party
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
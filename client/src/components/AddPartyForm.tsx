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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addPartyMutation = useMutation({
    mutationFn: async (partyData: { name: string; email: string; role: string }) => {
      const response = await apiRequest('POST', `/api/v1/transactions/${transactionId}/parties`, partyData);
      return response.json();
    },
    onSuccess: (data) => {
      // Critical fix: Invalidate the transaction query to refetch updated party list
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
      
      // Also invalidate the transactions list if it exists
      queryClient.invalidateQueries({ queryKey: ['/api/v1/transactions'] });

      // Success is now indicated by the party appearing in the list - no toast needed

      // Reset form and close dialog
      setName("");
      setEmail("");
      setRole("seller");
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add party",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addPartyMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
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
                required
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
                required
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPartyMutation.isPending}>
              {addPartyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Party"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddPartyForm;
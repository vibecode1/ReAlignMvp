
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
  const [open, setOpen] = useState(false);

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
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full btn-mobile focus-enhanced">
          <Plus className="h-4 w-4 mr-2" />
          Add Party
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add Party to Transaction
            <DialogDescription className="mt-2">
              Add a new party to this transaction. They will receive an email notification with a link to track the transaction progress.
            </DialogDescription>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Name
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter party's full name"
                disabled={isLoading}
              />
            </Label>
          </div>

          <div>
            <Label htmlFor="email">
              Email
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter party's email address"
                disabled={isLoading}
              />
            </Label>
          </div>

          <div>
            <Label htmlFor="role">
              Role
              <Select value={role} onValueChange={setRole} disabled={isLoading}>
                <SelectTrigger id="role">
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
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Party"}
            </Button>
          </DialogFooter>
          {formError && (
            <p className="text-red-500 text-sm mt-2">{formError}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

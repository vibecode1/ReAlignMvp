import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Check, AlertTriangle } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';

export type PartyRole = 'seller' | 'buyer' | 'listing_agent' | 'buyers_agent' | 'escrow';
export type PartyStatus = 'pending' | 'complete' | 'overdue';

interface PartyCardProps {
  role: PartyRole;
  name: string;
  status: PartyStatus;
  lastAction?: string;
  isEditable?: boolean;
  onStatusChange?: (status: PartyStatus) => void;
}

export const PartyCard: React.FC<PartyCardProps> = ({
  role,
  name,
  status,
  lastAction,
  isEditable = false,
  onStatusChange
}) => {
  // Helper function to format role display
  const formatRole = (role: PartyRole): string => {
    switch(role) {
      case 'seller': return 'Seller';
      case 'buyer': return 'Buyer';
      case 'listing_agent': return 'Listing Agent';
      case 'buyers_agent': return 'Buyer\'s Agent';
      case 'escrow': return 'Escrow';
      default: return role;
    }
  };

  // Status badge with appropriate color and icon
  const renderStatusBadge = () => {
    switch(status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-400 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-transparent flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'complete':
        return (
          <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-transparent flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Complete</span>
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="border-red-400 text-red-600 dark:text-red-400 bg-red-50 dark:bg-transparent flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Overdue</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle status change for negotiators
  const handleStatusChange = (value: string) => {
    if (onStatusChange) {
      onStatusChange(value as PartyStatus);
    }
  };

  return (
    <Card className="w-full mb-3">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatRole(role)}</p>
            
            {lastAction && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {lastAction}
              </p>
            )}
          </div>
          
          <div className={cn("flex items-center", isEditable ? "flex-col sm:flex-row gap-2" : "")}>
            {isEditable ? (
              <Select defaultValue={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              renderStatusBadge()
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartyCard;
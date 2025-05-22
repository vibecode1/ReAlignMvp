import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface PartyInfo {
  userId: string;
  name: string;
  role: string;
  status: 'pending' | 'complete' | 'overdue';
  lastAction?: string;
}

interface PartyCardProps {
  parties: PartyInfo[];
  title?: string;
}

export const PartyCard = ({ 
  parties,
  title = "Transaction Parties"
}: PartyCardProps) => {
  // Helper to render status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  // Helper to get role display name
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'seller': 'Seller',
      'buyer': 'Buyer',
      'listing_agent': 'Listing Agent',
      'buyers_agent': 'Buyer\'s Agent',
      'escrow': 'Escrow',
      'negotiator': 'Negotiator'
    };
    
    return roleMap[role] || role;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {parties.length === 0 ? (
            <p className="text-gray-500 italic">No parties associated with this transaction.</p>
          ) : (
            parties.map((party) => (
              <motion.div 
                key={party.userId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(party.status)}
                </div>
                
                <div className="ml-3 flex-grow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        {party.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getRoleDisplay(party.role)}
                      </p>
                    </div>
                    
                    <div className="mt-1 sm:mt-0">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${party.status === 'complete' ? 'bg-green-100 text-green-800' : ''}
                        ${party.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                        ${party.status === 'overdue' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {party.status.charAt(0).toUpperCase() + party.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {party.lastAction && (
                    <p className="mt-1 text-xs text-gray-500">
                      Last action: {party.lastAction}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartyCard;

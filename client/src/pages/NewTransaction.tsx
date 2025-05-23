import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define schema for form validation
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }),
  property_address: z.string().min(5, {
    message: "Property address must be at least 5 characters",
  }),
  initialPhase: z.string({
    required_error: "Please select an initial phase",
  }),
  initialMessage: z.string().min(10, {
    message: "Initial message must be at least 10 characters",
  }),
  seller: z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    phone: z.string().optional(),
    sms_opt_in: z.boolean().optional(),
  }),
  buyer: z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    phone: z.string().optional(),
    sms_opt_in: z.boolean().optional(),
  }).optional(),
  listing_agent: z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    phone: z.string().optional(),
    sms_opt_in: z.boolean().optional(),
  }).optional(),
  buyers_agent: z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    phone: z.string().optional(),
    sms_opt_in: z.boolean().optional(),
  }).optional(),
  escrow: z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    phone: z.string().optional(),
    sms_opt_in: z.boolean().optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTransaction() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [addBuyer, setAddBuyer] = useState(false);
  const [addListingAgent, setAddListingAgent] = useState(false);
  const [addBuyersAgent, setAddBuyersAgent] = useState(false);
  const [addEscrow, setAddEscrow] = useState(false);
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      property_address: "",
      initialPhase: "Transaction Initiated",
      initialMessage: "Welcome to this transaction! I'll be your negotiator throughout this process.",
      seller: {
        name: "",
        email: "",
        phone: "",
        sms_opt_in: false,
      },
    },
  });

  // Available transaction phases
  const PHASES = [
    "Transaction Initiated",
    "Property Listed",
    "Initial Document Collection",
    "Offer Received",
    "Offer Submitted",
    "Lender Review",
    "BPO Ordered",
    "Approval Received",
    "In Closing"
  ];
  
  // Create transaction mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      // Format the request payload
      const parties = [
        {
          role: "seller",
          name: data.seller.name,
          email: data.seller.email,
        },
      ];
      
      // Add optional parties
      if (data.buyer && addBuyer) {
        parties.push({
          role: "buyer",
          name: data.buyer.name,
          email: data.buyer.email,
        });
      }
      
      if (data.listing_agent && addListingAgent) {
        parties.push({
          role: "listing_agent",
          name: data.listing_agent.name,
          email: data.listing_agent.email,
        });
      }
      
      if (data.buyers_agent && addBuyersAgent) {
        parties.push({
          role: "buyers_agent",
          name: data.buyers_agent.name,
          email: data.buyers_agent.email,
        });
      }
      
      if (data.escrow && addEscrow) {
        parties.push({
          role: "escrow",
          name: data.escrow.name,
          email: data.escrow.email,
        });
      }
      
      const payload = {
        title: data.title,
        property_address: data.property_address,
        currentPhase: data.initialPhase,
        parties,
        initialMessage: data.initialMessage,
      };
      
      const response = await apiRequest('POST', '/api/v1/transactions', payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Created",
        description: "Your new transaction has been created successfully.",
      });
      
      // Navigate to the new transaction
      navigate(`/transactions/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error);
      toast({
        title: "Creation Failed",
        description: "There was an error creating the transaction. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    // Only negotiators can create transactions
    if (user?.role !== 'negotiator') {
      toast({
        title: "Permission Denied",
        description: "Only negotiators can create new transactions.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the form data
    mutate(data);
  };
  
  return (
    <div>
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          className="mr-4"
          onClick={() => navigate('/transactions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Create New Transaction</h1>
          <p className="text-gray-600 mt-1">Enter the details to set up a new transaction</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Basic information about the transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., 123 Main St Short Sale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="property_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Anytown, CA 90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="initialPhase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Phase</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a phase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PHASES.map((phase) => (
                          <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="initialMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Welcome message for all participants" 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Parties</CardTitle>
              <CardDescription>
                Add people involved in this transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seller - Required */}
              <div className="border p-4 rounded-md">
                <h3 className="text-md font-medium mb-4">Seller (Required)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="seller.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seller.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="seller.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seller.sms_opt_in"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 mt-6">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Send SMS notifications</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Buyer - Optional */}
              <div>
                <div className="flex items-center mb-4">
                  <Button
                    type="button"
                    variant={addBuyer ? "secondary" : "outline"}
                    onClick={() => setAddBuyer(!addBuyer)}
                  >
                    {addBuyer ? "Remove Buyer" : "Add Buyer"}
                  </Button>
                </div>
                
                {addBuyer && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-md font-medium mb-4">Buyer</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="buyer.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Buyer Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="buyer.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Buyer Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Listing Agent - Optional */}
              <div>
                <div className="flex items-center mb-4">
                  <Button
                    type="button"
                    variant={addListingAgent ? "secondary" : "outline"}
                    onClick={() => setAddListingAgent(!addListingAgent)}
                  >
                    {addListingAgent ? "Remove Listing Agent" : "Add Listing Agent"}
                  </Button>
                </div>
                
                {addListingAgent && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-md font-medium mb-4">Listing Agent</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="listing_agent.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="listing_agent.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Buyer's Agent - Optional */}
              <div>
                <div className="flex items-center mb-4">
                  <Button
                    type="button"
                    variant={addBuyersAgent ? "secondary" : "outline"}
                    onClick={() => setAddBuyersAgent(!addBuyersAgent)}
                  >
                    {addBuyersAgent ? "Remove Buyer's Agent" : "Add Buyer's Agent"}
                  </Button>
                </div>
                
                {addBuyersAgent && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-md font-medium mb-4">Buyer's Agent</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="buyers_agent.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="buyers_agent.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Escrow - Optional */}
              <div>
                <div className="flex items-center mb-4">
                  <Button
                    type="button"
                    variant={addEscrow ? "secondary" : "outline"}
                    onClick={() => setAddEscrow(!addEscrow)}
                  >
                    {addEscrow ? "Remove Escrow Officer" : "Add Escrow Officer"}
                  </Button>
                </div>
                
                {addEscrow && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-md font-medium mb-4">Escrow Officer</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="escrow.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Officer Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="escrow.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Officer Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/transactions')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Transaction"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
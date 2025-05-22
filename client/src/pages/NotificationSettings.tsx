import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label"; 
import { 
  Bell,
  Edit,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Mock notification rules that would come from the API
const NOTIFICATION_RULES = [
  {
    id: "1",
    type: "Transaction Invitation",
    description: "When a party is added to a transaction",
    recipients: "All invited parties",
    channels: ["Email", "SMS (if enabled)"],
    status: "active",
    enabled: true
  },
  {
    id: "2",
    type: "Magic Link Delivery",
    description: "When a user requests access via magic link",
    recipients: "Requesting user",
    channels: ["Email", "SMS (based on input)"],
    status: "active",
    enabled: true
  },
  {
    id: "3",
    type: "Document Request Sent",
    description: "When a negotiator requests a document",
    recipients: "Assigned party",
    channels: ["Email", "SMS (if enabled)", "Push", "In-App"],
    status: "active",
    enabled: true
  },
  {
    id: "4",
    type: "Document Request Reminder",
    description: "When a document request is pending",
    recipients: "Assigned party with pending request",
    channels: ["Email", "SMS (if enabled)", "Push", "In-App"],
    status: "active",
    enabled: true
  }
];

export default function NotificationSettings() {
  const [rules, setRules] = useState(NOTIFICATION_RULES);
  const [selectedRule, setSelectedRule] = useState<typeof NOTIFICATION_RULES[0] | null>(null);
  const [emailTemplate, setEmailTemplate] = useState("Reminder: Your [Document Type] is still needed for your short sale file [File Name]. Upload now to avoid delay: [DirectLinkToRequest]");
  const [pushTemplate, setPushTemplate] = useState("Reminder: [Document Type] for [File Name] is still needed. Tap to upload.");
  const [inAppTemplate, setInAppTemplate] = useState("Reminder: [Document Type] still pending.");
  const [isUpdating, setIsUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  
  // Stats for display
  const activeRulesCount = rules.filter(rule => rule.enabled).length;
  const notificationsSent = 124; // Would come from API
  const deliverySuccess = 97; // Would come from API
  
  // Toggle rule enabled/disabled
  const toggleRuleEnabled = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled } 
        : rule
    ));
    
    // In a real app, would make API call here
    toast({
      title: "Notification Setting Updated",
      description: `Rule has been ${rules.find(r => r.id === ruleId)?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };
  
  // Edit rule
  const handleEditRule = (rule: typeof NOTIFICATION_RULES[0]) => {
    setSelectedRule(rule);
    
    // In a real implementation, would fetch the templates from API
    // For now, using the same templates for all rules
  };
  
  // Save rule changes
  const handleSaveRule = () => {
    if (!selectedRule) return;
    
    setIsUpdating(true);
    
    // In a real implementation, would save to API
    setTimeout(() => {
      toast({
        title: "Rule Updated",
        description: "Notification rule has been updated successfully.",
      });
      setIsUpdating(false);
      setSelectedRule(null);
    }, 1000);
  };
  
  // Pagination handlers
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < 2) { // Mock pagination
      setPage(page + 1);
    }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-primary">Notification Management</h1>
        <p className="text-gray-600 mt-1">Configure notification preferences and rules</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Active Rules</h3>
                <span className="bg-brand-primary bg-opacity-10 text-brand-primary px-3 py-1 rounded-full text-sm">
                  {activeRulesCount} Rules
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold">{activeRulesCount}/{rules.length}</p>
              <p className="text-gray-500 text-sm mt-1">
                {activeRulesCount === rules.length 
                  ? "All notification rules are active" 
                  : `${rules.length - activeRulesCount} rules disabled`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Notifications Sent</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Last 7 days</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{notificationsSent}</p>
              <p className="text-gray-500 text-sm mt-1">+12% from previous period</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Delivery Success</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">{deliverySuccess}%</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{deliverySuccess}%</p>
              <p className="text-gray-500 text-sm mt-1">3 delivery failures</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Notification Rules Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Notification Rules</CardTitle>
          <CardDescription>Configure when and how notifications are sent to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channels
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.type}</div>
                      <div className="text-sm text-gray-500">{rule.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.recipients}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {rule.channels.map((channel, index) => (
                          <span 
                            key={index} 
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              channel.includes('if enabled') || channel.includes('based on') 
                                ? 'bg-gray-200 text-gray-800' 
                                : 'bg-brand-primary text-white'
                            }`}
                          >
                            {channel}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only notification-toggle" 
                            id={`toggle-${rule.id}`}
                            checked={rule.enabled}
                            onChange={() => toggleRuleEnabled(rule.id)}
                          />
                          <div className={`w-11 h-6 rounded-full transition ${
                            rule.enabled ? 'bg-brand-primary' : 'bg-gray-200'
                          }`}></div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-4 text-brand-primary"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing 1 to {rules.length} of 8 results
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={page === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(1)}
            >
              1
            </Button>
            <Button
              variant={page === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(2)}
            >
              2
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNextPage}
              disabled={page === 2}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Rule Editor */}
      {selectedRule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Notification Rule</CardTitle>
              <CardDescription>{selectedRule.type} Configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</Label>
                  <Input 
                    type="text" 
                    value={selectedRule.type} 
                    className="w-full" 
                    disabled 
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Trigger</Label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                    <option selected>Automatic CRON trigger (48h after no response)</option>
                    <option>Manual resend by negotiator</option>
                    <option>Custom trigger</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Recipients</Label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                    <option selected>{selectedRule.recipients}</option>
                    <option>All transaction participants</option>
                    <option>Negotiator only</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Enabled Channels</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center">
                      <Checkbox id="email-channel" checked />
                      <Label htmlFor="email-channel" className="ml-3">Email (default)</Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="sms-channel" checked />
                      <Label htmlFor="sms-channel" className="ml-3">SMS (if enabled by recipient)</Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="push-channel" checked />
                      <Label htmlFor="push-channel" className="ml-3">Push Notification (if enabled)</Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="inapp-channel" checked />
                      <Label htmlFor="inapp-channel" className="ml-3">In-App Feed</Label>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Message Templates</Label>
                  
                  <div className="space-y-4 mt-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-500">Email/SMS Template</span>
                      </div>
                      <Textarea 
                        rows={3} 
                        value={emailTemplate}
                        onChange={(e) => setEmailTemplate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-500">Push Notification Template</span>
                      </div>
                      <Textarea 
                        rows={2} 
                        value={pushTemplate}
                        onChange={(e) => setPushTemplate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-500">In-App Feed Template</span>
                      </div>
                      <Textarea 
                        rows={2} 
                        value={inAppTemplate}
                        onChange={(e) => setInAppTemplate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Available variables: [Document Type], [File Name], [Negotiator Name], [DirectLinkToRequest]
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedRule(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveRule}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Notification Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preview</CardTitle>
          <CardDescription>See how your notifications will appear to recipients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="font-medium">Email Preview</p>
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-500">To: john.doe@example.com</p>
                  <p className="text-sm text-gray-500">Subject: Document Request Reminder for 123 Main St</p>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-sm">Reminder: Your Bank Statements (2 Months) is still needed for your short sale file 123 Main St. Upload now to avoid delay: <a href="#" className="text-brand-primary">https://realign.app/doc/request/123</a></p>
                </div>
              </div>
            </div>
            
            {/* Mobile Push Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="font-medium">Push Notification Preview</p>
              </div>
              <div className="p-4">
                <div className="bg-gray-900 rounded-xl p-4 max-w-xs mx-auto">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded bg-brand-primary flex items-center justify-center text-white font-bold">R</div>
                    <div className="ml-3">
                      <p className="text-white text-sm font-semibold">ReAlign</p>
                      <p className="text-gray-300 text-xs">now</p>
                      <p className="text-white text-sm mt-1">Reminder: Bank Statements for 123 Main St is still needed. Tap to upload.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* In-App Notification Preview */}
          <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="font-medium">In-App Feed Preview</p>
            </div>
            <div className="p-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Reminder: Bank Statements (2 Months) still pending.</p>
                    <p className="text-gray-500 text-sm mt-1">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

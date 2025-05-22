import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import NotificationPermission from '@/components/notifications/NotificationPermission';
import { connectToWebSocket, setupWebSocketHandler } from '@/lib/notifications';
import { AlertCircle, Bell, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  
  // Settings for different notification types
  const [settings, setSettings] = useState({
    transactionUpdates: true,
    documentRequests: true,
    messages: true,
    statusChanges: true
  });

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const socket = connectToWebSocket();
    
    // Set up handler for WebSocket messages
    setupWebSocketHandler(socket, (data) => {
      if (data.type === 'connection') {
        setIsWebSocketConnected(true);
      }
    });

    // Clean up WebSocket connection on unmount
    return () => {
      socket.close();
    };
  }, []);

  // Handle settings changes
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
    
    // Show confirmation toast
    toast({
      title: settings[setting] ? 'Notifications disabled' : 'Notifications enabled',
      description: `You have ${settings[setting] ? 'disabled' : 'enabled'} ${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} notifications.`,
    });
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Notification Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage how and when you receive notifications about your transactions.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Push Notification Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={18} />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Enable browser notifications to stay updated even when you're not using the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPermission 
              onPermissionChange={(status) => {
                if (status === 'granted') {
                  toast({
                    title: 'Notifications enabled',
                    description: 'You will now receive push notifications for important updates.',
                  });
                }
              }}
            />
            
            {isWebSocketConnected && (
              <div className="mt-3 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Info size={12} />
                <span>Real-time updates are connected</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="transaction-updates">Transaction Updates</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notifications when a transaction changes phase
                </p>
              </div>
              <Switch 
                id="transaction-updates" 
                checked={settings.transactionUpdates}
                onCheckedChange={() => handleSettingChange('transactionUpdates')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="document-requests">Document Requests</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notifications for new document requests and reminders
                </p>
              </div>
              <Switch 
                id="document-requests" 
                checked={settings.documentRequests}
                onCheckedChange={() => handleSettingChange('documentRequests')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="messages">Messages</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notifications for new messages in transaction threads
                </p>
              </div>
              <Switch 
                id="messages" 
                checked={settings.messages}
                onCheckedChange={() => handleSettingChange('messages')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="status-changes">Status Changes</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notifications when a party's status changes
                </p>
              </div>
              <Switch 
                id="status-changes" 
                checked={settings.statusChanges}
                onCheckedChange={() => handleSettingChange('statusChanges')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={18} />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email notifications are always sent to <strong>{user?.email}</strong> for important updates and cannot be disabled for security reasons.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSettings;
import React, { useEffect, useState } from 'react';
import { requestNotificationPermission, getNotificationPermissionStatus } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { BellRing, BellOff, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPermissionProps {
  onPermissionChange?: (status: NotificationPermission) => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ 
  onPermissionChange 
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check initial permission status
  useEffect(() => {
    const checkPermission = async () => {
      const status = await getNotificationPermissionStatus();
      setPermissionStatus(status);
      if (onPermissionChange) {
        onPermissionChange(status);
      }
    };
    
    checkPermission();
  }, [onPermissionChange]);

  // Request permission handler
  const handleRequestPermission = async () => {
    setLoading(true);
    
    try {
      const granted = await requestNotificationPermission();
      
      const newStatus = granted ? 'granted' : 'denied';
      setPermissionStatus(newStatus);
      
      if (onPermissionChange) {
        onPermissionChange(newStatus);
      }
      
      toast({
        title: granted ? 'Notifications enabled' : 'Notifications disabled',
        description: granted 
          ? 'You will now receive important transaction updates' 
          : 'You will not receive push notifications. You can enable them later in settings.',
        variant: granted ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error enabling notifications',
        description: 'There was a problem enabling notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render based on current permission status
  if (permissionStatus === 'granted') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
        <BellRing size={16} />
        <span>Notifications enabled</span>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <BellOff size={16} />
          <span>Notifications are disabled</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex gap-1 items-start">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <span>
            You need to enable notifications in your browser settings to receive important transaction updates.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <Info size={16} />
        <span>Enable notifications to stay updated on transaction changes</span>
      </p>
      <Button 
        onClick={handleRequestPermission} 
        variant="outline" 
        className="bg-white dark:bg-gray-800"
        disabled={loading}
      >
        <BellRing size={16} className="mr-2" />
        {loading ? 'Enabling...' : 'Enable Notifications'}
      </Button>
    </div>
  );
};

export default NotificationPermission;
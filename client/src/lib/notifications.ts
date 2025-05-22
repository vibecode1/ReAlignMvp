import { apiRequest } from './queryClient';

/**
 * Requests permission for notifications and registers the device token
 * @returns Promise<boolean> - Whether permission was granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Use a browser fingerprint as token for web notifications
      const token = generateBrowserToken();
      
      // Send the token to the backend
      await apiRequest('/api/v1/notifications/device-tokens', 'POST', {
        token,
        type: 'web'
      });
      
      console.log('Web notification permission granted');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Generate a simple token based on browser info
 * In a production app, you would use a service like Firebase for proper device tokens
 */
const generateBrowserToken = (): string => {
  const browser = navigator.userAgent;
  const random = Math.floor(Math.random() * 1000000).toString();
  const now = new Date().getTime().toString();
  
  return btoa(`${browser}-${now}-${random}`).replace(/=/g, '').substring(0, 64);
};

/**
 * Gets the current notification permission status
 * @returns Promise<NotificationPermission> - The current permission status
 */
export const getNotificationPermissionStatus = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
};

/**
 * Send a test notification to the user
 * @param title - The notification title
 * @param body - The notification body
 */
export const sendTestNotification = (title: string, body: string): void => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon.png'
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

/**
 * Connect to the WebSocket server for real-time updates
 * @returns WebSocket connection
 */
export const connectToWebSocket = (): WebSocket => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      connectToWebSocket();
    }, 5000);
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return socket;
};

/**
 * Sets up a WebSocket message handler
 * @param socket WebSocket connection
 * @param handleMessage Function to handle incoming messages
 */
export const setupWebSocketHandler = (
  socket: WebSocket,
  handleMessage: (data: any) => void
): void => {
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleMessage(data);
      
      // If it's a notification message, show a browser notification
      if (data.type === 'notification' && Notification.permission === 'granted') {
        const notification = new Notification(data.title || 'ReAlign Notification', {
          body: data.message,
          icon: '/icon.png',
          data: data.data
        });
        
        notification.onclick = () => {
          window.focus();
          
          // Navigate to specific page based on notification data
          if (data.data?.transactionId) {
            window.location.href = `/transactions/${data.data.transactionId}`;
          }
          
          notification.close();
        };
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
};
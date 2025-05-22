import { apiRequest } from './queryClient';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration with placeholder values
// In production, these would come from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "realign-placeholder.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "realign-placeholder", 
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "realign-placeholder.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:placeholder"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let messaging: any = null;

try {
  messaging = getMessaging(app);
  console.log('Firebase messaging initialized successfully');
} catch (error) {
  console.warn('Firebase messaging initialization failed (placeholder config):', error);
}

/**
 * Requests permission for notifications and registers the FCM token
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
      // Try to get FCM token first
      let token: string | null = null;
      
      if (messaging) {
        try {
          token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'placeholder-vapid-key'
          });
          
          if (token) {
            // Send FCM token to the backend
            await apiRequest('/api/v1/notifications/device-tokens', 'POST', {
              token,
              type: 'fcm'
            });
            
            console.log('FCM token registered successfully');
            return true;
          }
        } catch (fcmError) {
          console.warn('Failed to get FCM token (placeholder config), falling back to web token:', fcmError);
        }
      }
      
      // Fallback to web token if FCM fails
      const webToken = generateBrowserToken();
      await apiRequest('/api/v1/notifications/device-tokens', 'POST', {
        token: webToken,
        type: 'web'
      });
      
      console.log('Web notification permission granted with fallback token');
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
 * Sets up Firebase Cloud Messaging foreground message handler
 */
export const setupFCMHandler = (): void => {
  if (!messaging) {
    console.warn('Firebase messaging not available, skipping FCM handler setup');
    return;
  }
  
  try {
    onMessage(messaging, (payload) => {
      console.log('Received foreground FCM message:', payload);
      
      // Show a browser notification for foreground messages
      if (Notification.permission === 'granted' && payload.notification) {
        const notification = new Notification(
          payload.notification.title || 'ReAlign Notification',
          {
            body: payload.notification.body || 'You have a new notification',
            icon: '/logo.png',
            data: payload.data
          }
        );
        
        notification.onclick = () => {
          window.focus();
          
          // Navigate to specific page based on notification data
          if (payload.data?.transactionId) {
            window.location.href = `/transactions/${payload.data.transactionId}`;
          }
          
          notification.close();
        };
      }
    });
    
    console.log('FCM foreground message handler set up successfully');
  } catch (error) {
    console.error('Failed to set up FCM handler:', error);
  }
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
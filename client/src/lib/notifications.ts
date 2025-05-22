import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { apiRequest } from './queryClient';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let messaging: any = null;
let firebaseInitialized = false;

try {
  const app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined' && 'Notification' in window) {
    messaging = getMessaging(app);
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

/**
 * Requests permission for notifications and registers the device token
 * @returns Promise<boolean> - Whether permission was granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized. Cannot request notification permission.');
    return false;
  }
  
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await registerDeviceToken();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Gets the FCM token and registers it with the backend
 */
export const registerDeviceToken = async (): Promise<void> => {
  if (!firebaseInitialized || !messaging) {
    console.warn('Firebase messaging not initialized');
    return;
  }
  
  try {
    // Get token from Firebase
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    if (currentToken) {
      // Send the token to the backend
      await apiRequest('/api/v1/notifications/device-tokens', 'POST', {
        token: currentToken,
        type: 'fcm'
      });
      
      console.log('Device token registered successfully');
    } else {
      console.warn('No registration token available');
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
};

/**
 * Sets up a listener for incoming push messages
 * @param callback Function to call when a message is received
 */
export const setupMessageListener = (callback: (payload: any) => void): void => {
  if (!firebaseInitialized || !messaging) {
    console.warn('Firebase messaging not initialized');
    return;
  }
  
  // Set up the message listener
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
  });
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
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
};
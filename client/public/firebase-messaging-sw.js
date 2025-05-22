// Firebase Cloud Messaging Service Worker

// Import and configure firebase
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration with placeholder values
// In production, these would be replaced with actual values
firebase.initializeApp({
  apiKey: 'placeholder-api-key',
  authDomain: 'realign-placeholder.firebaseapp.com',
  projectId: 'realign-placeholder',
  storageBucket: 'realign-placeholder.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:placeholder'
});

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'ReAlign Notification';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/badge.png',
    data: payload.data,
    // Tag is used to group similar notifications
    tag: payload.data?.type || 'general'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get data from the notification
  const data = event.notification.data;
  
  // Determine the URL to open based on notification data
  let url = '/dashboard';
  
  if (data) {
    if (data.transactionId) {
      url = `/transactions/${data.transactionId}`;
    } else if (data.type === 'message') {
      url = `/transactions/${data.transactionId}#messages`;
    } else if (data.type === 'document') {
      url = `/transactions/${data.transactionId}#documents`;
    }
  }
  
  // Open or focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
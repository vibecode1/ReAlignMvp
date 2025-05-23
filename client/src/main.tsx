import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupFCMHandler } from "./lib/notifications";

// Initialize Firebase Cloud Messaging handlers
setupFCMHandler();

// Inject Firebase config into service worker
if ('serviceWorker' in navigator) {
  // Inject environment variables into the service worker global scope
  const firebaseConfig = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID
  };

  // Register service worker and inject config
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Firebase messaging service worker registered:', registration);
      
      // Send config to service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig
        });
      }
    })
    .catch((error) => {
      console.error('Service worker registration failed:', error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);

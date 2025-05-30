import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to prevent white screens
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser behavior (which might show errors in console)
  event.preventDefault();
  
  // Show user-friendly error message instead of crashing
  console.warn('An error occurred in the background. The application should continue to work normally.');
  
  // Try to show a toast notification if available
  if (window.location.pathname.includes('uba-form')) {
    console.warn('UBA Form: Background error occurred during document processing. Please try again if the upload failed.');
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Log additional context
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

createRoot(document.getElementById("root")!).render(<App />);

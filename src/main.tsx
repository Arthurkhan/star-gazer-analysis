import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enhanced error logging for debugging
console.log("Application starting...");

// Wrap the whole app in a try-catch to log errors
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Failed to find the root element!");
    throw new Error("Failed to find the root element");
  }
  
  console.log("Root element found, creating root...");
  const root = createRoot(rootElement);
  
  // Add more detailed logging
  console.log("Mounting application...");
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log("Application mounted successfully");
} catch (error) {
  console.error("Critical error in application initialization:", error);
  // Display a fallback UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
        <h2>Application Error</h2>
        <p>Sorry, the application couldn't load properly. Please check the console for details.</p>
      </div>
    `;
  }
}

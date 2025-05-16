import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Wrap the whole app in a try-catch to log errors
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Failed to find the root element");
  
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log("Application mounted successfully");
} catch (error) {
  console.error("Error in application initialization:", error);
}

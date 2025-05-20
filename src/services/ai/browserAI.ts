import { BrowserAIService } from './BrowserAIService';

/**
 * This file provides backward compatibility for imports that still reference 'browserAI'
 * It simply re-exports the BrowserAIService implementation
 */

// Re-export the main browser AI service
export { BrowserAIService };

// Provide a default export for legacy imports
export default BrowserAIService;

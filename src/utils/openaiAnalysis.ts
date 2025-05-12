
// This file re-exports everything from the new files to maintain backward compatibility
import { getSelectedModel, testApiKey } from "./ai/aiProviders";
import { analyzeReviewsWithAI, getAnalysis, clearCache } from "./ai/analysisService";

// Re-export the functions to maintain backward compatibility
export { 
  getSelectedModel,
  testApiKey,
  analyzeReviewsWithAI as analyzeReviewsWithOpenAI,
  getAnalysis,
  clearCache
};

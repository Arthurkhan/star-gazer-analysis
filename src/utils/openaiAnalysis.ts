
// This file re-exports everything from the new files to maintain backward compatibility
import { getSelectedModel, testApiKey } from "./ai/aiProviders";
import { analyzeReviewsWithAI, getAnalysis } from "./ai/analysisService";
import { clearCache } from "./ai/analysisCache";

// Re-export the functions to maintain backward compatibility
export { 
  getSelectedModel,
  testApiKey,
  analyzeReviewsWithAI as analyzeReviewsWithOpenAI,
  getAnalysis,
  clearCache
};

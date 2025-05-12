
// This file handles caching of analysis results
import { Review } from "@/types/reviews";

// Cache for analysis results to avoid repeated API calls
const analysisCache = new Map<string, any>();

// Helper to generate a cache key
export function generateCacheKey(reviews: Review[], provider: string): string {
  const cacheTimestamp = localStorage.getItem("analysis_cache_key") || Date.now().toString();
  return `${provider}_${reviews.length}_${reviews.slice(0, 3).map(r => r.publishedAtDate).join('_')}_${cacheTimestamp}`;
}

// Check if analysis is in cache
export function getFromCache(cacheKey: string): any | null {
  if (analysisCache.has(cacheKey)) {
    console.log("Using cached analysis result");
    return analysisCache.get(cacheKey);
  }
  return null;
}

// Store analysis in cache
export function storeInCache(cacheKey: string, analysis: any): void {
  analysisCache.set(cacheKey, analysis);
  // Update cache timestamp for next time
  localStorage.setItem("analysis_cache_key", Date.now().toString());
}

// Clear cache (useful when refreshing analysis)
export function clearCache(): void {
  localStorage.removeItem("analysis_cache_key");
}

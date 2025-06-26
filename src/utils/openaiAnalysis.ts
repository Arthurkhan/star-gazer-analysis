
// This file maintains backward compatibility but with empty implementations

// Stub functions that do nothing
export const getSelectedModel = () => ''
export const testApiKey = () => Promise.resolve(false)
export const analyzeReviewsWithOpenAI = () => Promise.resolve({
  sentimentAnalysis: [],
  staffMentions: [],
  commonTerms: [],
  overallAnalysis: '',
})
export const getAnalysis = () => Promise.resolve({
  sentimentAnalysis: [],
  staffMentions: [],
  commonTerms: [],
  overallAnalysis: '',
})
export const clearCache = () => {}

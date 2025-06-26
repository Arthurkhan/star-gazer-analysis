// Define proper types
interface Review {
  rating: number;
  text: string;
  id?: string;
  sentiment?: string;
  keyPhrases?: string[];
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ComparisonData {
  current: { count: number };
  previous: { count: number };
  change: {
    percentage: string;
    description: string;
  };
}

interface AIResponseChoice {
  message?: { content: string };
  text?: string;
}

interface AIResponse {
  choices?: AIResponseChoice[];
}

interface Analysis {
  sentimentAnalysis: unknown[];
  staffMentions: unknown[];
  commonTerms: unknown[];
  overallAnalysis: string;
}

// Generate the prompt for AI
export function generatePrompt(
  reviews: Review[],
  fullAnalysis: boolean,
  reportType: string,
  dateRange: DateRange | undefined,
  customPrompt: string | undefined,
  comparisonData: ComparisonData | null = null,
): string {
  // Use custom prompt if available, otherwise use default prompt
  const analysisPrompt = customPrompt || getDefaultPrompt()

  // Prepare reviews for insertion into prompt
  const reviewText = reviews.map(r => `Rating: ${r.rating}, Text: ${r.text}`).join('\n')

  // Replace placeholders in the prompt with actual data
  let prompt = analysisPrompt.replace(/\[REVIEWS\]/g, reviewText)
  prompt = prompt.replace(/\[count\]/g, reviews.length.toString())

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 'N/A'
  prompt = prompt.replace(/\[calculate\]/g, averageRating)

  // Add date range information
  if (dateRange) {
    prompt = prompt.replace(/\[start date\]/g, new Date(dateRange.startDate).toLocaleDateString())
    prompt = prompt.replace(/\[end date\]/g, new Date(dateRange.endDate).toLocaleDateString())
  } else {
    prompt = prompt.replace(/\[start date\]/g, 'N/A')
    prompt = prompt.replace(/\[end date\]/g, 'N/A')
  }

  // Calculate reviews per month
  let reviewsPerMonth = 'N/A'
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1
    reviewsPerMonth = (reviews.length / months).toFixed(1)
  }
  prompt = prompt.replace(/\[reviews per month\]/g, reviewsPerMonth)

  // Add trend analysis information
  if (comparisonData) {
    prompt = prompt.replace(/\[X reviews\]/g, comparisonData.current.count.toString())
    prompt = prompt.replace(/\[Y reviews\]/g, comparisonData.previous.count > 0 ? comparisonData.previous.count.toString() : 'No data available')
    prompt = prompt.replace(/\[\+\/- percentage\]/g, comparisonData.change.percentage !== 'N/A' ? `${parseFloat(comparisonData.change.percentage).toFixed(1)}%` : 'New period')
    prompt = prompt.replace(/\[Increasing\/Decreasing\/Stable\/New\]/g, comparisonData.change.description)
  } else {
    prompt = prompt.replace(/\[X reviews\]/g, reviews.length.toString())
    prompt = prompt.replace(/\[Y reviews\]/g, 'No data available')
    prompt = prompt.replace(/\[\+\/- percentage\]/g, 'New period')
    prompt = prompt.replace(/\[Increasing\/Decreasing\/Stable\/New\]/g, 'New')
  }

  return prompt
}

// Get the system message for AI
export function getSystemMessage(fullAnalysis: boolean, reportType: string): string {
  let systemMessage = 'You are an AI assistant that analyzes customer reviews and provides insights.'

  if (fullAnalysis) {
    systemMessage += ' Your analysis should be comprehensive, covering sentiment, common themes, and staff mentions.'
  } else {
    systemMessage += ' Focus on overall sentiment and key topics.'
  }

  if (reportType === 'comprehensive') {
    systemMessage += ' The report should be detailed and include trend analysis.'
  } else {
    systemMessage += ' Keep the report concise and to the point.'
  }

  return systemMessage
}

// Parse the AI response
export function parseAIResponse(data: AIResponse, _provider: string): Analysis {
  if (!data || !data.choices || data.choices.length === 0) {
    // Invalid AI response
    return {
      sentimentAnalysis: [],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: 'No analysis could be generated.',
    }
  }

  const response = data.choices[0].message?.content || data.choices[0].text

  try {
    // Attempt to parse the AI's response as JSON
    const parsedResponse = JSON.parse(response || '{}')
    return parsedResponse
  } catch (error) {
    // If it's not JSON, treat the entire response as the overall analysis
    // AI response is not JSON, treating as overall analysis
    return {
      sentimentAnalysis: [],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: response || '',
    }
  }
}

// Create a complete analysis structure
export function createCompleteAnalysis(analysis: Analysis, fullAnalysis: boolean): Analysis {
  const defaultAnalysis: Analysis = {
    sentimentAnalysis: [],
    staffMentions: [],
    commonTerms: [],
    overallAnalysis: analysis.overallAnalysis || 'No overall analysis available.',
  }

  if (fullAnalysis) {
    return {
      sentimentAnalysis: analysis.sentimentAnalysis || [],
      staffMentions: analysis.staffMentions || [],
      commonTerms: analysis.commonTerms || [],
      overallAnalysis: analysis.overallAnalysis || 'No overall analysis available.',
    }
  } else {
    return defaultAnalysis
  }
}

// Extract individual review analysis (not fully implemented)
export function extractIndividualReviewAnalysis(reviews: Review[]): unknown[] {
  return reviews.map(review => ({
    reviewId: review.id,
    sentiment: review.sentiment,
    keyPhrases: review.keyPhrases,
  }))
}

// Format the overall analysis with better readability
export function formatOverallAnalysis(text: string): string {
  // Add emojis to section headers if not already present
  text = text.replace(/^PERFORMANCE SNAPSHOT/gm, '📊 PERFORMANCE SNAPSHOT')
  text = text.replace(/^TREND ANALYSIS/gm, '📈 TREND ANALYSIS')
  text = text.replace(/^CUSTOMER HIGHLIGHTS/gm, '🗣️ CUSTOMER HIGHLIGHTS')
  text = text.replace(/^SAMPLE REVIEWS/gm, '💬 SAMPLE REVIEWS')
  text = text.replace(/^AUDIENCE INSIGHTS/gm, '🌍 AUDIENCE INSIGHTS')
  text = text.replace(/^RECOMMENDATIONS/gm, '🎯 RECOMMENDATIONS')

  return text
}

// Generate the default prompt template
export function getDefaultPrompt(): string {
  return `
Analyze the reviews and create a comprehensive report following this exact format:

📊 PERFORMANCE SNAPSHOT
- Average Rating: [calculate]/5 ⭐
- Total Reviews: [count]
- Review Period: [start date] to [end date]
- Monthly Average: [reviews per month]

📈 TREND ANALYSIS
- Current Period: [X reviews]
- Previous Period: [Y reviews] or "No data available"
- Change: [+/- percentage]% or "New period" or "N/A"
- Momentum: [Increasing/Decreasing/Stable/New]

🗣️ CUSTOMER HIGHLIGHTS
Top Mentioned Categories:
1. [Most common theme from mainThemes]
2. [Second most common theme]
3. [Third most common theme]

Key Sentiments:
- Positive: [percentage]%
- Neutral: [percentage]%
- Negative: [percentage]%

Frequently Mentioned:
- [Top 3 from common terms with counts]

Staff Impact: [Analyze staffMentioned data]

💬 SAMPLE REVIEWS
[Include 2-3 representative reviews]

🌍 AUDIENCE INSIGHTS
- Languages: [List with percentages]
- International Appeal: [Strong/Moderate/Limited]
- Peak Review Times: [Analyze patterns]

🎯 RECOMMENDATIONS
[Generate 3-5 specific recommendations based on the analysis]
`
}

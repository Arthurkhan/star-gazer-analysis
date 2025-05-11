
import { Review } from "@/types/reviews";

// Function to analyze reviews using OpenAI
export const analyzeReviewsWithOpenAI = async (
  reviews: Review[]
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral" }[];
  commonTerms: { text: string; count: number }[];
  overallAnalysis: string;
}> => {
  try {
    // Prepare review data for API
    const reviewTexts = reviews.map(review => ({
      text: review.text,
      rating: review.star,
      date: review.publishedAtDate
    }));

    // Limit the number of reviews to analyze if there are too many (to avoid token limits)
    const limitedReviews = reviewTexts.slice(0, 100);

    // Create the prompt for OpenAI
    const prompt = `
      Analyze these ${limitedReviews.length} customer reviews from a total of ${reviews.length} reviews:
      ${JSON.stringify(limitedReviews)}
      
      Please provide:
      1. A sentiment breakdown with exact counts for positive, neutral, and negative reviews
      2. A list of staff members mentioned in the reviews with the count of mentions and overall sentiment toward each staff member
      3. Common terms/themes mentioned in reviews with their frequency
      4. A brief overall analysis of the review trends
      
      Format the response as a JSON with the following structure:
      {
        "sentimentAnalysis": [{"name": "Positive", "value": number}, {"name": "Neutral", "value": number}, {"name": "Negative", "value": number}],
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative"}, ...],
        "commonTerms": [{"text": "term", "count": number}, ...],
        "overallAnalysis": "text analysis"
      }
    `;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getOpenAIApiKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes customer reviews and extracts insights. Respond only with the requested JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Return the analysis in the expected format
    return {
      sentimentAnalysis: analysis.sentimentAnalysis || [],
      staffMentions: analysis.staffMentions || [],
      commonTerms: analysis.commonTerms || [],
      overallAnalysis: analysis.overallAnalysis || "",
    };
  } catch (error) {
    console.error("OpenAI analysis failed:", error);
    
    // Fallback to basic analysis if OpenAI fails
    return {
      sentimentAnalysis: [
        { name: "Positive", value: reviews.filter(r => r.star >= 4).length },
        { name: "Neutral", value: reviews.filter(r => r.star === 3).length },
        { name: "Negative", value: reviews.filter(r => r.star <= 2).length },
      ],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: "Unable to generate detailed analysis. Using basic rating-based analysis instead.",
    };
  }
};

// Helper function to get API key
function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY || "";
  if (!key) {
    console.warn("OpenAI API key not found");
  }
  return key;
}

// Cache for analysis results to avoid repeated API calls
const analysisCache = new Map<string, any>();

// Function to get or create analysis
export const getAnalysis = async (reviews: Review[]): Promise<any> => {
  // Create a cache key based on the number of reviews and their IDs
  const cacheKey = `${reviews.length}_${reviews.slice(0, 5).map(r => r.publishedAtDate).join('_')}`;
  
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }
  
  const analysis = await analyzeReviewsWithOpenAI(reviews);
  analysisCache.set(cacheKey, analysis);
  return analysis;
};

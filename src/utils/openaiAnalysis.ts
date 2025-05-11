
import { Review } from "@/types/reviews";

// Function to analyze reviews using OpenAI
export const analyzeReviewsWithOpenAI = async (
  reviews: Review[]
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number }[];
  overallAnalysis: string;
}> => {
  try {
    // Check if we have a valid API key
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      console.error("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable or use the setup button.");
      throw new Error("OpenAI API key not found");
    }

    // Prepare review data for API
    const reviewTexts = reviews.map(review => ({
      text: review.text,
      rating: review.star,
      date: review.publishedAtDate
    }));

    // Limit the number of reviews to analyze if there are too many (to avoid token limits)
    const limitedReviews = reviewTexts.slice(0, 100);

    console.log(`Sending ${limitedReviews.length} reviews to OpenAI for analysis...`);

    // Create the prompt for OpenAI
    const prompt = `
      Analyze these ${limitedReviews.length} customer reviews from a total of ${reviews.length} reviews:
      ${JSON.stringify(limitedReviews)}
      
      Please provide:
      1. A sentiment breakdown with exact counts for positive, neutral, and negative reviews
      2. A detailed list of staff members mentioned in the reviews with:
         - The exact name of each staff member as mentioned in reviews
         - The count of distinct mentions
         - Overall sentiment toward each staff member (positive/neutral/negative)
         - 2-3 exact quotes from reviews that mention each staff member
      3. Common terms/themes mentioned in reviews with their frequency
      4. A brief overall analysis of the review trends
      
      Format the response as a JSON with the following structure:
      {
        "sentimentAnalysis": [{"name": "Positive", "value": number}, {"name": "Neutral", "value": number}, {"name": "Negative", "value": number}],
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...],
        "commonTerms": [{"text": "term", "count": number}, ...],
        "overallAnalysis": "text analysis"
      }
      
      IMPORTANT GUIDELINES FOR STAFF EXTRACTION:
      - Only include actual staff members (people working at the business), not generic mentions like "staff" or "server"
      - For each staff member, include exact quotes from reviews where they are mentioned
      - If someone seems to be a customer rather than staff, do not include them
      - If no staff are mentioned by name in any review, return an empty array for staffMentions
      - Look very carefully for names of individual staff members in the review text
      - Pay special attention to sentences that mention service, employees, or contain phrases like "our waiter", "our server", etc.
      - Look specifically for mentions of staff like "Laura", "Arnaud", "Nazare-Aga", and any other names of people who work at the establishment
    `;

    // Call OpenAI API
    console.log("Calling OpenAI API with authorization...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes customer reviews and extracts insights. You're particularly good at identifying staff members mentioned by name and analyzing sentiment about them. Respond only with the requested JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
      }),
    });

    console.log("OpenAI API Response Status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API call failed with status: ${response.status}`, errorData);
      throw new Error(`API call failed with status: ${response.status}. Details: ${errorData}`);
    }

    const data = await response.json();
    console.log("OpenAI Raw Response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Unexpected response format from OpenAI:", data);
      throw new Error("Invalid response format from OpenAI");
    }

    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
      console.log("Parsed OpenAI Analysis Results:", analysis);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.log("Raw content that couldn't be parsed:", data.choices[0].message.content);
      throw new Error("Failed to parse OpenAI response");
    }

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
      overallAnalysis: "Unable to generate detailed analysis. Using basic rating-based analysis instead. Error: " + error.message,
    };
  }
};

// Helper function to get API key
function getOpenAIApiKey(): string {
  // First try to get from environment variable, then from localStorage
  const key = process.env.OPENAI_API_KEY || localStorage.getItem("OPENAI_API_KEY") || "";
  
  if (!key) {
    console.warn("OpenAI API key not found in environment variables or localStorage");
    // Could add alternative ways to get the key here if needed
  } else {
    console.log("OpenAI API key found (masked):", key.substring(0, 3) + "..." + key.substring(key.length - 3));
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
    console.log("Using cached analysis result");
    return analysisCache.get(cacheKey);
  }
  
  console.log("No cached result found, performing fresh analysis");
  const analysis = await analyzeReviewsWithOpenAI(reviews);
  analysisCache.set(cacheKey, analysis);
  return analysis;
};

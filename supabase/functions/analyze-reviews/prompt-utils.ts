
// This file handles generating prompts and formatting responses

// Get custom prompt if available or return default prompt
export function generatePrompt(reviews: any[], fullAnalysis: boolean = true, customPrompt?: string) {
  const reviewsJSON = JSON.stringify(reviews);
  
  if (customPrompt && customPrompt.includes("[REVIEWS]")) {
    // Use custom prompt with reviews inserted
    return customPrompt.replace("[REVIEWS]", reviewsJSON);
  } else {
    // Use default structured prompt
    return `
      Analyze these ${reviews.length} customer reviews:
      ${reviewsJSON}
      
      ${fullAnalysis ? `
      Please provide:
      1. A sentiment breakdown with exact counts for positive, neutral, and negative reviews
      2. A detailed list of staff members mentioned in the reviews with:
         - The exact name of each staff member as mentioned in reviews
         - The count of distinct mentions
         - Overall sentiment toward each staff member (positive/neutral/negative)
         - 2-3 exact quotes from reviews that mention each staff member
      3. Common terms/themes mentioned in reviews with their frequency
      4. A brief overall analysis of the review trends
      ` : `
      FOCUS ONLY ON STAFF MENTIONS in these reviews. Please identify:
      - The exact name of each staff member mentioned in reviews
      - The count of distinct mentions for each staff member
      - Overall sentiment toward each staff member (positive/neutral/negative)
      - 2-3 exact quotes from reviews that mention each staff member
      `}
      
      Format the response as a JSON object without markdown formatting, code blocks, or backticks. Here's the required structure:
      ${fullAnalysis ? `
      {
        "sentimentAnalysis": [{"name": "Positive", "value": number}, {"name": "Neutral", "value": number}, {"name": "Negative", "value": number}],
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...],
        "commonTerms": [{"text": "term", "count": number}, ...],
        "overallAnalysis": "text analysis"
      }
      ` : `
      {
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...]
      }
      `}
      
      IMPORTANT GUIDELINES FOR STAFF EXTRACTION:
      - Only include actual staff members (people working at the business), not generic mentions like "staff" or "server"
      - For each staff member, include exact quotes from reviews where they are mentioned
      - If someone seems to be a customer rather than staff, do not include them
      - If no staff are mentioned by name in any review, return an empty array for staffMentions
      - Look very carefully for names of individual staff members in the review text
      - Pay special attention to sentences that mention service, employees, or contain phrases like "our waiter", "our server", etc.
    `;
  }
}

// System message that instructs the AI about the task
export function getSystemMessage(fullAnalysis: boolean) {
  return fullAnalysis
    ? "You are an AI assistant that analyzes customer reviews and extracts insights. You're particularly good at identifying staff members mentioned by name and analyzing sentiment about them. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks."
    : "You are an AI assistant that identifies staff members mentioned in customer reviews. Your only task is to extract mentions of individual staff members by name. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks.";
}

// Parse the AI response according to provider
export function parseAIResponse(data: any, provider: string) {
  try {
    if (provider === "anthropic") {
      return JSON.parse(data.content[0].text);
    } else if (provider === "gemini") {
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } else { // OpenAI
      // Clean potential markdown formatting from the content
      let content = data.choices[0].message.content;
      
      // Remove markdown code blocks if present
      if (content.startsWith("```") && content.endsWith("```")) {
        const lines = content.split("\n");
        lines.shift(); // Remove first line with ```json or ```
        lines.pop();   // Remove last line with ```
        content = lines.join("\n");
      }
      
      // Remove any remaining backticks just in case
      content = content.replace(/```/g, "");
      
      // Parse the cleaned JSON
      return JSON.parse(content);
    }
  } catch (parseError) {
    console.error(`Failed to parse ${provider} response as JSON:`, parseError);
    console.log("Raw content that couldn't be parsed:", JSON.stringify(data));
    throw new Error(`Failed to parse ${provider} response`);
  }
}

// Create a complete analysis structure
export function createCompleteAnalysis(analysis: any, fullAnalysis: boolean) {
  if (!fullAnalysis) {
    return {
      sentimentAnalysis: [],
      staffMentions: analysis.staffMentions || [],
      commonTerms: [],
      overallAnalysis: "",
    };
  }
  return analysis;
}

// Extract individual review analysis for database updates
export function extractIndividualReviewAnalysis(review: any, analysisResults: any) {
  // Default values
  let sentiment = "neutral";
  let staffMentioned = "";
  let mainThemes = "";
  
  // Determine sentiment based on review rating
  if (review.star >= 4) {
    sentiment = "positive";
  } else if (review.star <= 2) {
    sentiment = "negative";
  }
  
  // Check if staff are mentioned in this specific review
  if (analysisResults.staffMentions && analysisResults.staffMentions.length > 0) {
    const mentionedStaff = [];
    
    // Loop through all identified staff members
    for (const staff of analysisResults.staffMentions) {
      // Check if any examples for this staff mention the current review
      if (staff.examples && staff.examples.length > 0) {
        for (const example of staff.examples) {
          if (review.text.includes(example) || 
              (review.translatedText && review.translatedText.includes(example))) {
            mentionedStaff.push(staff.name);
            break; // Found a match, no need to check other examples
          }
        }
      }
    }
    
    // Join the staff names with commas
    staffMentioned = mentionedStaff.join(", ");
  }
  
  // Extract main themes from the review text
  if (analysisResults.commonTerms && analysisResults.commonTerms.length > 0) {
    const reviewThemes = [];
    
    // Check if the review contains any of the common terms
    for (const term of analysisResults.commonTerms) {
      const termRegex = new RegExp('\\b' + term.text + '\\b', 'i');
      if (termRegex.test(review.text) || 
          (review.translatedText && termRegex.test(review.translatedText))) {
        reviewThemes.push(term.text);
      }
      
      // Limit to top 5 themes
      if (reviewThemes.length >= 5) break;
    }
    
    // Join the themes with commas
    mainThemes = reviewThemes.join(", ");
  }
  
  return {
    sentiment,
    staffMentioned,
    mainThemes
  };
}



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
         - The exact name of each staff member as mentioned in reviews (combine similar names like Anna/Ana/Anne to the most common version)
         - The count of distinct mentions
         - Overall sentiment toward each staff member (positive/neutral/negative)
         - 2-3 exact quotes from reviews that mention each staff member
      3. Common terms/themes mentioned in reviews with their frequency, grouped into these categories:
         - Service (staff behavior, customer service, waiting time)
         - Ambiance (atmosphere, decor, environment, music, lighting)
         - Food & Drinks (taste, menu options, presentation, quality)
         - Value (pricing, portion size, value for money)
         - Cleanliness (hygiene, tidiness)
         - Location (accessibility, parking, area)
         - Special Features (unique offerings, events, art, exhibitions)
         - Little Prince Theme (book references, characters, story elements)
         - Art Gallery (exhibitions, artwork, installations)
         - Overall Experience (satisfaction, return likelihood)
      4. A comprehensive analysis of the review trends including:
         - How reviews have evolved over time (improving/declining/steady)
         - Key strengths consistently mentioned
         - Areas that might need improvement
         - Any seasonal patterns if visible
         - Impact of specific staff members on customer satisfaction
      ` : `
      FOCUS ONLY ON STAFF MENTIONS in these reviews. Please identify:
      - The exact name of each staff member mentioned in reviews (combine similar names like Anna/Ana/Anne to the most common version)
      - The count of distinct mentions for each staff member
      - Overall sentiment toward each staff member (positive/neutral/negative)
      - 2-3 exact quotes from reviews that mention each staff member
      `}
      
      Format the response as a JSON object without markdown formatting, code blocks, or backticks. Here's the required structure:
      ${fullAnalysis ? `
      {
        "sentimentAnalysis": [{"name": "Positive", "value": number}, {"name": "Neutral", "value": number}, {"name": "Negative", "value": number}],
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...],
        "commonTerms": [{"text": "term", "count": number, "category": "Service|Ambiance|Food & Drinks|Value|Cleanliness|Location|Special Features|Little Prince Theme|Art Gallery|Overall Experience"}, ...],
        "overallAnalysis": "text analysis"
      }
      ` : `
      {
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...]
      }
      `}
      
      IMPORTANT GUIDELINES FOR STAFF EXTRACTION:
      - Only include actual staff members (people working at the business), not generic mentions like "staff" or "server"
      - Consolidate variations of the same name using these guidelines:
        * Arnaud/Armand/The Boss/Artist/Mr. Arnaud/Owner → Arnaud
        * Anna/Ana/Anne/Nong Ana/Nong Ena → Anna
        * Sam/Sammy/Samuel/Samantha → Sam
        * Dave/David/Davey → Dave
        * Mike/Michael/Mikey/Michel → Mike
        * Alex/Alexander/Alexandra/Alexa → Alex
        * Peps/Pepsi/Pep → Peps
      - For each staff member, include exact quotes from reviews where they are mentioned
      - If someone seems to be a customer rather than staff, do not include them
      - If no staff are mentioned by name in any review, return an empty array for staffMentions
      - Look very carefully for names of individual staff members in the review text
      - Pay special attention to sentences that mention service, employees, or contain phrases like "our waiter", "our server", etc.
      
      IMPORTANT GUIDELINES FOR TERM CATEGORIZATION:
      - Group similar terms together (e.g., "great food", "delicious food", "tasty dishes" should be grouped under a common term)
      - Be specific with categories - don't overuse "Others" category
      - For Little Prince Theme category, include any terms related to the book, characters, or story elements
      - For Art Gallery category, include terms related to exhibitions, artwork, installations
      - Ensure terms are evenly distributed across categories rather than having one dominant category
    `;
  }
}

// System message that instructs the AI about the task
export function getSystemMessage(fullAnalysis: boolean) {
  return fullAnalysis
    ? "You are an AI assistant that analyzes customer reviews and extracts insights. You're particularly good at identifying staff members mentioned by name, consolidating variations of the same name, and analyzing sentiment about them. You're also skilled at categorizing review themes into meaningful groups and providing actionable business intelligence. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks."
    : "You are an AI assistant that identifies staff members mentioned in customer reviews. Your only task is to extract mentions of individual staff members by name, consolidating variations of the same name. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks.";
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
  
  // Determine sentiment based on review rating or AI analysis
  if (analysisResults.sentimentAnalysis) {
    // Try to use AI sentiment if available
    if (review.star >= 4) {
      sentiment = "positive";
    } else if (review.star <= 2) {
      sentiment = "negative";
    }
  } else {
    // Use rating-based sentiment as fallback
    if (review.star >= 4) {
      sentiment = "positive";
    } else if (review.star <= 2) {
      sentiment = "negative";
    }
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
              (review.textTranslated && review.textTranslated.includes(example))) {
            mentionedStaff.push(staff.name);
            break; // Found a match, no need to check other examples
          }
        }
      }
    }
    
    // Join the staff names with commas
    staffMentioned = mentionedStaff.join(", ");
  }
  
  // Extract main themes from the review text using AI-identified categories
  if (analysisResults.commonTerms && analysisResults.commonTerms.length > 0) {
    const reviewThemes = [];
    
    // Check if the review contains any of the common terms, prioritizing categories
    const categoriesFound = new Set();
    
    for (const term of analysisResults.commonTerms) {
      const termRegex = new RegExp('\\b' + term.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      
      if ((review.text && termRegex.test(review.text)) || 
          (review.textTranslated && review.textTranslated.includes(term.text))) {
        
        // Add the category if it exists, otherwise the term itself
        if (term.category) {
          // Only add the category if we haven't added it yet (avoid duplicates)
          if (!categoriesFound.has(term.category)) {
            categoriesFound.add(term.category);
            reviewThemes.push(`${term.category}: ${term.text}`);
          }
        } else {
          reviewThemes.push(term.text);
        }
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


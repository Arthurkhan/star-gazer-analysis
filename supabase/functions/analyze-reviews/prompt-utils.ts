
// This file handles generating prompts and formatting responses

// Get custom prompt if available or return default prompt
export function generatePrompt(
  reviews: any[], 
  fullAnalysis: boolean = true, 
  reportType: string = 'standard', 
  dateRange?: any, 
  customPrompt?: string
) {
  const reviewsJSON = JSON.stringify(reviews);
  
  if (customPrompt && customPrompt.includes("[REVIEWS]")) {
    // Use custom prompt with reviews inserted
    return customPrompt.replace("[REVIEWS]", reviewsJSON);
  } else {
    // Comprehensive analysis focuses on the 4 key columns
    const isComprehensive = reportType === 'comprehensive';
    
    // Date range information (if provided)
    const dateRangeInfo = dateRange ? 
      `for the period ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}` : 
      '';
    
    // Basic prompt structure
    return `
      Analyze these ${reviews.length} customer reviews ${dateRangeInfo}:
      ${reviewsJSON}
      
      ${fullAnalysis ? `
      ${isComprehensive ? `
      Please provide a COMPREHENSIVE analysis that specifically focuses on these 4 key columns from the reviews:
      1. sentiment - analyze the overall sentiment patterns
      2. staffMentioned - identify staff impact and trends
      3. mainThemes - extract and categorize the main themes
      4. commonTerms - identify frequently mentioned terms and group them by category
      
      FOCUS on creating an in-depth, executive-level report that follows this EXACT structure:
      
      📊 PERFORMANCE SNAPSHOT
      - Average Rating: [X]/5 ⭐
      - Total Reviews: [number]
      - Review Period: [dates from earliest to latest review]
      - Monthly Average: [number of reviews per month]
      
      📈 TREND ANALYSIS
      - Current Period: [X reviews]
      - Previous Period: [Y reviews] or "No data available"
      - Change: [+/- percentage]% or "New period (no previous data)" or "N/A" 
      - Momentum: [Increasing/Decreasing/Stable/New]
      
      🗣️ CUSTOMER HIGHLIGHTS
      Top Mentioned Categories:
      1. [Category 1]
      2. [Category 2]
      3. [Category 3]
      
      Key Sentiments:
      - Positive: [percentage]%
      - Neutral: [percentage]%
      - Negative: [percentage]%
      
      Frequently Mentioned:
      - [Top 3 from common terms with counts]
      
      Staff Impact: [Include specific staff members that are frequently mentioned and their impact]
      
      💬 SAMPLE REVIEWS
      - [Include 2-3 actual customer quotes that represent the overall sentiment]
      
      🌍 AUDIENCE INSIGHTS
      - Languages: [List main languages with percentages]
      - International Appeal: [Strong/Moderate/Limited]
      - Peak Review Times: [Analyze publishedAtDate patterns]
      
      🎯 RECOMMENDATIONS
      - [Specific action item 1 based on sentiment patterns]
      - [Improvement suggestion based on common complaints]
      - [Opportunity based on positive trends]
      - [Targeted recommendation about staff if applicable]
      - [Seasonal or timing recommendation if patterns exist]
      ` : `
      Please provide a detailed analysis following this exact structure:
      
      📊 PERFORMANCE SNAPSHOT
      - Average Rating: [X]/5 ⭐
      - Total Reviews: [number]
      - Review Period: [dates from earliest to latest review]
      - Monthly Average: [number of reviews per month]
      
      📈 TREND ANALYSIS
      - Current Period: [X reviews]
      - Previous Period: [Y reviews] or "No data available"
      - Change: [+/- percentage]% or "New period (no previous data)" or "N/A" 
      - Momentum: [Increasing/Decreasing/Stable/New]
      
      🗣️ CUSTOMER HIGHLIGHTS
      Top Mentioned Categories:
      1. [Category 1]
      2. [Category 2]
      3. [Category 3]
      
      Staff Impact: [Mention any key staff that significantly impact experiences]
      
      💬 SAMPLE REVIEWS
      - [Include 2-3 actual customer quotes that represent the overall sentiment]
      
      🌍 AUDIENCE INSIGHTS
      - Languages: [List main languages with percentages]
      - International Appeal: [Strong/Moderate/Limited]
      
      🎯 RECOMMENDATIONS
      - [Specific action item 1]
      - [Specific action item 2]
      - [Specific action item 3]
      `}
      
      ${isComprehensive ? 
        `Focus PRIMARILY on analyzing the "sentiment", "staffMentioned", "mainThemes", and "common terms" columns from the reviews to create this comprehensive analysis.` : 
        `Focus primarily on analyzing the "Sentiment", "Staff Mentioned", "Main Themes", and "Common terms" columns from the reviews to create this comprehensive analysis.`
      }
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
        "overallAnalysis": "text analysis that follows the EXACTLY the format specified"
      }
      ` : `
      {
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...]
      }
      `}
    `;
  }
}

// System message that instructs the AI about the task
export function getSystemMessage(fullAnalysis: boolean, reportType: string = 'standard') {
  const isComprehensive = reportType === 'comprehensive';
  
  if (isComprehensive) {
    return "You are an AI business intelligence expert specialized in analyzing customer reviews data. Your task is to create a comprehensive, executive-level report based on the reviews provided, focusing SPECIFICALLY on the 'sentiment', 'staffMentioned', 'mainThemes', and 'common terms' columns. Your analysis must include detailed insights on sentiment patterns, staff impact, customer themes, and actionable recommendations. Your report must follow the EXACT format specified with proper section headers, emojis for readability, and data-driven insights. For trend analysis, if previous period has 0 reviews, display 'Change: New period (no previous data)'. Calculate percentage change properly: ((current - previous) / previous * 100). If previous is 0, show 'N/A'. If both periods are 0, show 'No activity in either period'. Focus on being specific, insightful, and actionable. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks.";
  } else if (fullAnalysis) {
    return "You are an AI assistant that analyzes customer reviews and extracts insights. Focus specifically on analyzing the 'Sentiment', 'Staff Mentioned', 'Main Themes', and 'Common terms' columns to create a comprehensive analysis. Format your analysis with clear section headers, emojis, bullet points, and specific metrics to make it easy to read. For trend analysis, if previous period has 0 reviews, display 'Change: New period (no previous data)'. Calculate percentage change properly: ((current - previous) / previous * 100). If previous is 0, show 'N/A'. If both periods are 0, show 'No activity in either period'. Follow the EXACT format specified in the prompt. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks.";
  } else {
    return "You are an AI assistant that identifies staff members mentioned in customer reviews. Your only task is to extract mentions of individual staff members by name, consolidating variations of the same name. Respond ONLY with the requested JSON format without any markdown formatting, code blocks, or backticks.";
  }
}

// Parse the AI response according to provider
export function parseAIResponse(data: any, provider: string) {
  try {
    if (provider === "anthropic") {
      return JSON.parse(data.content[0].text);
    } else if (provider === "gemini") {
      // Clean potential markdown formatting from the content
      let content = data.candidates[0].content.parts[0].text;
      
      // Remove markdown code blocks if present
      if (content.includes("```json") && content.includes("```")) {
        content = content.replace(/```json/g, "").replace(/```/g, "");
      }
      
      // Remove any remaining backticks just in case
      content = content.replace(/`/g, "");
      
      // Parse the cleaned JSON
      return JSON.parse(content);
    } else { // OpenAI
      // Clean potential markdown formatting from the content
      let content = data.choices[0].message.content;
      
      // Remove markdown code blocks if present
      if (content.includes("```json") && content.includes("```")) {
        content = content.replace(/```json/g, "").replace(/```/g, "");
      }
      
      // Remove any remaining backticks just in case
      content = content.replace(/`/g, "");
      
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

// Format the overall analysis for better readability
export function formatOverallAnalysis(analysis: string | any): string {
  // Check if analysis is a string
  if (typeof analysis !== 'string') {
    // Try to convert it to a string if it's not already
    try {
      analysis = analysis?.toString() || "";
    } catch (e) {
      return "Error formatting analysis";
    }
  }
  
  if (!analysis) return "";
  
  // The AI now includes formatting in its response based on the prompt,
  // but we'll ensure it's properly formatted here as well
  let formattedAnalysis = analysis;
  
  // Convert sections to proper headings if not already
  if (!formattedAnalysis.includes('📊 PERFORMANCE SNAPSHOT')) {
    // Add emojis to section headings if missing
    formattedAnalysis = formattedAnalysis
      .replace(/PERFORMANCE SNAPSHOT/g, '📊 PERFORMANCE SNAPSHOT')
      .replace(/TREND ANALYSIS/g, '📈 TREND ANALYSIS')
      .replace(/CUSTOMER HIGHLIGHTS/g, '🗣️ CUSTOMER HIGHLIGHTS')
      .replace(/SAMPLE REVIEWS/g, '💬 SAMPLE REVIEWS')
      .replace(/AUDIENCE INSIGHTS/g, '🌍 AUDIENCE INSIGHTS')
      .replace(/RECOMMENDATIONS/g, '🎯 RECOMMENDATIONS');
  }
  
  // Ensure proper spacing between sections
  formattedAnalysis = formattedAnalysis.replace(/\n(📊|📈|🗣️|💬|🌍|🎯)/g, '\n\n$1');
  
  // Format bullet points if needed
  if (!formattedAnalysis.includes('• ') && !formattedAnalysis.includes('- ')) {
    formattedAnalysis = formattedAnalysis.replace(/([.?!])\s+([A-Z])/g, '$1\n• $2');
  }
  
  // Improve trend analysis formatting
  formattedAnalysis = formattedAnalysis.replace(
    /(Change:\s+)([+-]?\d+)%/g, 
    (match, prefix, number) => `${prefix}${number > 0 ? '+' : ''}${number}%`
  );
  
  return formattedAnalysis;
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

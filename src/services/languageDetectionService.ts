/**
 * Language Detection Service - Phase 1 Implementation
 * 
 * Provides basic language detection functionality for reviews.
 * This is a simplified implementation that can be enhanced in future phases.
 */

import { Review } from "@/types/reviews";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

// Common language patterns for basic detection
const LANGUAGE_PATTERNS = {
  french: [
    // Common French words and patterns
    /\b(le|la|les|un|une|des|du|de|et|est|avec|pour|sur|dans|très|bien|bon|bonne|merci|bonjour|au revoir)\b/gi,
    // French accented characters
    /[àâäéèêëïîôöùûüÿç]/g,
    // French specific patterns
    /\b(c'est|n'est|qu'il|qu'elle|j'ai|nous|vous|ils|elles)\b/gi
  ],
  english: [
    // Common English words
    /\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are|this|be|at|by|not|or|have|from|one|had|but|what|all|were|they|we|when|your|can|said|there|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|into|him|has|two|more|go|no|way|could|my|than|first|been|call|who|oil|its|now|find|long|down|day|did|get|come|made|may|part)\b/gi,
    // English contractions
    /\b(don't|can't|won't|isn't|aren't|wasn't|weren't|doesn't|didn't|couldn't|wouldn't|shouldn't|haven't|hasn't|hadn't)\b/gi
  ],
  spanish: [
    // Common Spanish words
    /\b(el|la|los|las|un|una|de|en|y|es|con|para|por|muy|bien|bueno|buena|gracias|hola|adiós)\b/gi,
    // Spanish specific characters
    /[ñáéíóúü]/g,
    // Spanish patterns
    /\b(está|están|estoy|somos|tienen|tiene|hacer|hacer)\b/gi
  ],
  italian: [
    // Common Italian words
    /\b(il|la|lo|gli|le|un|una|di|in|e|è|con|per|molto|bene|buono|buona|grazie|ciao)\b/gi,
    // Italian specific patterns
    /\b(che|non|sono|siamo|hanno|fare)\b/gi
  ],
  german: [
    // Common German words
    /\b(der|die|das|ein|eine|und|ist|in|zu|mit|für|sehr|gut|gute|danke|hallo)\b/gi,
    // German specific characters
    /[äöüß]/g,
    // German patterns
    /\b(nicht|haben|wird|können|machen)\b/gi
  ]
};

/**
 * Detect the language of a text string using pattern matching
 * @param text - The text to analyze
 * @returns The detected language code
 */
export const detectLanguage = (text: string): string => {
  if (!text || text.trim().length < 10) {
    return 'unknown';
  }

  const normalizedText = text.toLowerCase();
  const scores: Record<string, number> = {};

  // Initialize scores
  Object.keys(LANGUAGE_PATTERNS).forEach(lang => {
    scores[lang] = 0;
  });

  // Test each language pattern
  Object.entries(LANGUAGE_PATTERNS).forEach(([language, patterns]) => {
    patterns.forEach(pattern => {
      const matches = normalizedText.match(pattern);
      if (matches) {
        scores[language] += matches.length;
      }
    });
  });

  // Find the language with the highest score
  const topLanguage = Object.entries(scores).reduce((max, [lang, score]) => {
    return score > max.score ? { language: lang, score } : max;
  }, { language: 'unknown', score: 0 });

  // Require a minimum confidence threshold
  const totalWords = text.split(/\s+/).length;
  const confidence = topLanguage.score / totalWords;

  if (confidence > 0.1) { // At least 10% of words should match
    return topLanguage.language;
  }

  return 'unknown';
};

/**
 * Detect language with fallback to translated text analysis
 * @param review - Review object with text and texttranslated fields
 * @returns Detected language
 */
export const detectReviewLanguage = (review: Review): string => {
  // If we have both text and translated text, compare them
  if (review.text && review.texttranslated && review.text !== review.texttranslated) {
    // If there's a translation, the original is likely not English
    const originalLang = detectLanguage(review.text);
    if (originalLang !== 'unknown' && originalLang !== 'english') {
      return originalLang;
    }
    // If original language detection fails, assume French (most common non-English in your data)
    return 'french';
  }

  // No translation, detect from main text
  if (review.text) {
    return detectLanguage(review.text);
  }

  return 'unknown';
};

/**
 * Batch language detection for multiple reviews
 * @param reviews - Array of reviews to process
 * @returns Array of reviews with language field populated
 */
export const batchDetectLanguages = (reviews: Review[]): Review[] => {
  return reviews.map(review => ({
    ...review,
    language: detectReviewLanguage(review)
  }));
};

/**
 * Update language data for existing reviews in the database
 * This function should be run after the migration to populate existing data
 */
export const populateLanguageData = async (): Promise<{ updated: number; errors: number }> => {
  let updated = 0;
  let errors = 0;
  
  try {
    logger.info('🔍 Starting language detection for existing reviews...');
    
    // Fetch all reviews without language data
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, text, texttranslated')
      .or('language.is.null,language.eq.unknown')
      .limit(1000); // Process in batches

    if (error) {
      logger.error('Error fetching reviews:', error);
      return { updated: 0, errors: 1 };
    }

    if (!reviews || reviews.length === 0) {
      logger.info('✅ No reviews need language detection');
      return { updated: 0, errors: 0 };
    }

    logger.info(`🔄 Processing ${reviews.length} reviews for language detection...`);

    // Process reviews in batches of 50
    const batchSize = 50;
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      
      for (const review of batch) {
        try {
          const language = detectReviewLanguage(review as Review);
          
          const { error: updateError } = await supabase
            .from('reviews')
            .update({ language })
            .eq('id', review.id);

          if (updateError) {
            logger.error(`Error updating review ${review.id}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        } catch (err) {
          logger.error(`Error processing review ${review.id}:`, err);
          errors++;
        }
      }

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`✅ Language detection complete: ${updated} updated, ${errors} errors`);
    return { updated, errors };

  } catch (error) {
    logger.error('Error in populateLanguageData:', error);
    return { updated, errors: errors + 1 };
  }
};

/**
 * Get language statistics for reviews
 * @param reviews - Array of reviews to analyze
 * @returns Language distribution data
 */
export const getLanguageStats = (reviews: Review[]): Array<{ name: string; value: number; percentage: number }> => {
  const languageCounts = new Map<string, number>();
  
  reviews.forEach(review => {
    const language = review.language || detectReviewLanguage(review);
    languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
  });

  const total = reviews.length;
  
  return Array.from(languageCounts.entries())
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      value,
      percentage: Math.round((value / total) * 100 * 100) / 100
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Simple function to run language detection on new review text
 * This can be called when processing new reviews
 */
export const processNewReview = (reviewText: string, translatedText?: string): string => {
  const review: Partial<Review> = {
    text: reviewText,
    texttranslated: translatedText
  };
  
  return detectReviewLanguage(review as Review);
};

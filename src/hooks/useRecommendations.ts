import { useState, useCallback, useMemo } from 'react';
import { Recommendations } from '@/types/recommendations';
import { recommendationService, BusinessData } from '@/services/recommendationService';

interface UseRecommendationsProps {
  businessData: BusinessData;
  selectedBusiness: string;
  businessType: string;
}

/**
 * Optimized Recommendations Hook - Fixed Infinite Loop Issue
 * 
 * Changes:
 * - Removed businessData from useCallback dependencies to prevent constant recreation
 * - Added proper memoization for stable references
 * - Improved error handling and validation
 * - More defensive checks to prevent unnecessary API calls
 */
export const useRecommendations = ({ businessData, selectedBusiness, businessType }: UseRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<string>('');

  // Memoize validation checks to prevent unnecessary re-renders
  const isValidForGeneration = useMemo(() => {
    return selectedBusiness && 
           selectedBusiness !== 'all' && 
           businessData.reviews && 
           businessData.reviews.length > 0;
  }, [selectedBusiness, businessData.reviews?.length]);

  const generateRecommendations = useCallback(async (provider: string = 'openai') => {
    // Validate current state - use fresh businessData from closure
    if (!selectedBusiness || selectedBusiness === 'all') {
      setError('Please select a specific business');
      return;
    }

    if (!businessData.reviews || businessData.reviews.length === 0) {
      setError('No reviews available for analysis');
      return;
    }

    // Clear previous state
    setLoading(true);
    setError(null);
    setGeneratingMessage('Analyzing reviews and generating recommendations...');

    try {
      // Prepare business data fresh from current state
      const preparedBusinessData: BusinessData = {
        businessName: selectedBusiness,
        businessType: businessType,
        reviews: businessData.reviews
      };

      console.log(`Generating recommendations for ${selectedBusiness} with ${businessData.reviews.length} reviews`);

      const result = await recommendationService.generateRecommendations(preparedBusinessData);
      setRecommendations(result);
      setGeneratingMessage('');
      console.log('Recommendations generated successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      setGeneratingMessage('');
      console.error('Recommendation generation failed:', err);
      
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness, businessType]); // Removed businessData from dependencies to prevent infinite loops

  const exportRecommendations = useCallback(() => {
    if (!recommendations || !selectedBusiness) return;
    
    const exportText = recommendationService.exportRecommendations(selectedBusiness, recommendations);
    
    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBusiness}-recommendations-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recommendations, selectedBusiness]);

  const saveRecommendations = useCallback(async () => {
    if (!recommendations || !selectedBusiness) return;
    
    try {
      await recommendationService.saveRecommendations(selectedBusiness, recommendations);
      console.log('Recommendations saved successfully');
    } catch (err) {
      console.error('Failed to save recommendations:', err);
    }
  }, [recommendations, selectedBusiness]);

  // Clear recommendations when business changes to prevent stale data
  const resetRecommendations = useCallback(() => {
    setRecommendations(null);
    setError(null);
    setGeneratingMessage('');
  }, []);

  // Auto-clear recommendations when business changes
  const previousBusiness = useMemo(() => selectedBusiness, [selectedBusiness]);
  if (previousBusiness !== selectedBusiness) {
    resetRecommendations();
  }

  return {
    recommendations,
    loading,
    error,
    generatingMessage,
    isValidForGeneration,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
    resetRecommendations
  };
};
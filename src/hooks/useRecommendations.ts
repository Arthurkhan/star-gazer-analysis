import { useState, useCallback } from 'react';
import { Recommendations } from '@/types/recommendations';
import { recommendationService, BusinessData } from '@/services/recommendationService';

interface UseRecommendationsProps {
  businessData: BusinessData;
  selectedBusiness: string;
  businessType: string;
}

/**
 * Simplified Recommendations Hook
 * Phase 3: Basic loading states and API calls, no complex error handling
 */
export const useRecommendations = ({ businessData, selectedBusiness, businessType }: UseRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<string>('');

  const generateRecommendations = useCallback(async (provider: string = 'openai') => {
    if (!selectedBusiness || selectedBusiness === 'all') {
      setError('Please select a specific business');
      return;
    }

    if (!businessData.reviews || businessData.reviews.length === 0) {
      setError('No reviews available for analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratingMessage('Analyzing reviews and generating recommendations...');

    try {
      const preparedBusinessData: BusinessData = {
        businessName: selectedBusiness,
        businessType: businessType,
        reviews: businessData.reviews
      };

      const result = await recommendationService.generateRecommendations(preparedBusinessData);
      setRecommendations(result);
      setGeneratingMessage('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      setGeneratingMessage('');
      console.error('Recommendation generation failed:', err);
      
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness, businessData, businessType]);

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

  return {
    recommendations,
    loading,
    error,
    generatingMessage,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations
  };
};
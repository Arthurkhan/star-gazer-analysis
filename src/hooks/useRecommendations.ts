import { useState, useCallback, useMemo, useEffect } from 'react';
import { Recommendations } from '@/types/recommendations';
import { recommendationService, BusinessData } from '@/services/recommendationService';

interface UseRecommendationsProps {
  businessData: BusinessData;
  selectedBusiness: string;
  businessType: string;
}

export interface GenerationProgress {
  stage: 'preparing' | 'analyzing' | 'generating' | 'finalizing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

/**
 * Enhanced Recommendations Hook with Progress Tracking
 */
export const useRecommendations = ({ businessData, selectedBusiness, businessType }: UseRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<string>('');
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'preparing',
    message: '',
    progress: 0
  });

  // Memoize validation checks to prevent unnecessary re-renders
  const isValidForGeneration = useMemo(() => {
    return selectedBusiness && 
           selectedBusiness !== 'all' && 
           businessData.reviews && 
           businessData.reviews.length > 0;
  }, [selectedBusiness, businessData.reviews?.length]);

  // Progress simulation for better UX
  useEffect(() => {
    if (loading && progress.progress < 90) {
      const interval = setInterval(() => {
        setProgress(prev => {
          let newProgress = prev.progress;
          let newStage = prev.stage;
          let newMessage = prev.message;

          if (prev.progress < 20) {
            newProgress = Math.min(20, prev.progress + 2);
            newStage = 'preparing';
            newMessage = 'Preparing review data...';
          } else if (prev.progress < 50) {
            newProgress = Math.min(50, prev.progress + 1.5);
            newStage = 'analyzing';
            newMessage = `Analyzing ${businessData.reviews?.length || 0} reviews...`;
          } else if (prev.progress < 80) {
            newProgress = Math.min(80, prev.progress + 1);
            newStage = 'generating';
            newMessage = 'Generating AI recommendations...';
          } else if (prev.progress < 90) {
            newProgress = Math.min(90, prev.progress + 0.5);
            newStage = 'finalizing';
            newMessage = 'Finalizing recommendations...';
          }

          return {
            stage: newStage,
            message: newMessage,
            progress: newProgress
          };
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [loading, progress.progress, businessData.reviews?.length]);

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
    setGeneratingMessage('Starting AI analysis...');
    setProgress({
      stage: 'preparing',
      message: 'Preparing review data...',
      progress: 0
    });

    try {
      // Prepare business data fresh from current state
      const preparedBusinessData: BusinessData = {
        businessName: selectedBusiness,
        businessType: businessType,
        reviews: businessData.reviews
      };

      console.log(`Generating recommendations for ${selectedBusiness} with ${businessData.reviews.length} reviews`);

      const result = await recommendationService.generateRecommendations(preparedBusinessData);
      
      // Complete the progress
      setProgress({
        stage: 'complete',
        message: 'Recommendations ready!',
        progress: 100
      });

      setRecommendations(result);
      setGeneratingMessage('');
      console.log('Recommendations generated successfully');
      
      // Clear progress after a short delay
      setTimeout(() => {
        setProgress({
          stage: 'preparing',
          message: '',
          progress: 0
        });
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      setGeneratingMessage('');
      setProgress({
        stage: 'error',
        message: errorMessage,
        progress: 0
      });
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
    setProgress({
      stage: 'preparing',
      message: '',
      progress: 0
    });
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
    progress,
    isValidForGeneration,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
    resetRecommendations
  };
};

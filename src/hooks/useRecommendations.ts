import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type Recommendations } from '@/types/recommendations';
import { type BusinessType } from '@/types/businessTypes';
import { type AIProvider } from '@/components/AIProviderToggle';
import { RecommendationService } from '@/services/recommendationService';

interface UseRecommendationsProps {
  businessData: any;
  selectedBusiness: string;
  businessType: BusinessType;
}

export const useRecommendations = ({ 
  businessData, 
  selectedBusiness,
  businessType 
}: UseRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateRecommendations = useCallback(async (provider: AIProvider) => {
    if (!selectedBusiness || !businessData || !businessData.reviews) {
      toast({
        title: "Error",
        description: "Please select a business with reviews first",
        variant: "destructive",
      });
      return;
    }

    // Check if we have reviews
    if (!businessData.reviews || businessData.reviews.length === 0) {
      toast({
        title: "Error",
        description: "No reviews found for this business",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new RecommendationService();
      service.setProvider(provider);

      // Map the review data to match what the service expects
      const mappedReviews = businessData.reviews.map((review: any) => ({
        rating: review.stars || 0,
        stars: review.stars || 0,
        text: review.text || review.comment || '',
        owner_response: review.responseFromOwnerText || null,
        sentiment: review.sentiment || 'neutral',
        mainThemes: review.mainThemes || '',
        staffMentioned: review.staffMentioned || '',
        // Keep other properties
        ...review
      }));

      // Calculate metrics properly
      const totalReviews = mappedReviews.length;
      const avgRating = totalReviews > 0 
        ? mappedReviews.reduce((sum: number, r: any) => sum + (r.stars || 0), 0) / totalReviews
        : 0;
      const responseRate = totalReviews > 0
        ? mappedReviews.filter((r: any) => r.owner_response).length / totalReviews
        : 0;

      // Prepare analysis data
      const analysisData = {
        business: selectedBusiness,
        businessType,
        reviews: mappedReviews,
        metrics: {
          totalReviews,
          avgRating,
          responseRate,
        },
        patterns: businessData.patterns || {},
        sentiment: businessData.sentiment || {},
      };

      console.log('Analysis Data:', analysisData); // Debug log

      const result = await service.generateRecommendations(analysisData);
      setRecommendations(result);
      
      toast({
        title: "Success",
        description: "Recommendations generated successfully",
      });
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to generate recommendations',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness, businessData, businessType, toast]);

  const exportRecommendations = useCallback(() => {
    if (!recommendations) return;

    const exportData = {
      business: selectedBusiness,
      businessType,
      generatedAt: new Date().toISOString(),
      recommendations,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations-${selectedBusiness}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Recommendations exported successfully",
    });
  }, [recommendations, selectedBusiness, businessType, toast]);

  const saveRecommendations = useCallback(async () => {
    if (!recommendations || !selectedBusiness) return;

    try {
      const { error } = await supabase
        .from('saved_recommendations')
        .insert({
          business_name: selectedBusiness,
          business_type: businessType,
          recommendations: recommendations,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Recommendations saved successfully",
      });
    } catch (err) {
      console.error('Error saving recommendations:', err);
      toast({
        title: "Error",
        description: "Failed to save recommendations",
        variant: "destructive",
      });
    }
  }, [recommendations, selectedBusiness, businessType, toast]);

  return {
    recommendations,
    loading,
    error,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
  };
};

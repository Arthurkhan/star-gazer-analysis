
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type Recommendations, type BusinessType } from '@/types/recommendations';
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

      // Create a placeholder for expected result structure that matches our defined types
      const mockResult: Recommendations = {
        analysis: {
          sentimentAnalysis: [
            { name: 'Positive', value: mappedReviews.filter((r: any) => r.sentiment === 'positive').length },
            { name: 'Neutral', value: mappedReviews.filter((r: any) => r.sentiment === 'neutral').length },
            { name: 'Negative', value: mappedReviews.filter((r: any) => r.sentiment === 'negative').length }
          ],
          staffMentions: [],
          commonTerms: [],
          overallAnalysis: "Analysis in progress...",
        },
        suggestions: [],
        actionPlan: {
          title: "Initial Action Plan",
          description: "This is an automatically generated action plan based on your reviews.",
          steps: [],
          expectedResults: "Improved customer satisfaction and business growth",
          timeframe: "short_term"
        },
        urgentActions: [],
        patternInsights: [],
        longTermStrategies: [],
        competitivePosition: {
          overview: "Competitive analysis in progress...",
          competitors: [],
          strengthsWeaknesses: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
          },
          recommendations: [],
          position: "average",
          metrics: {
            rating: { value: avgRating, benchmark: 4.0, percentile: 50 },
            reviewVolume: { value: totalReviews, benchmark: 100, percentile: 50 },
            sentiment: { value: 0.5, benchmark: 0.5, percentile: 50 }
          },
          strengths: [],
          weaknesses: [],
          opportunities: []
        },
        customerAttractionPlan: {
          overview: "Marketing plan in development...",
          objectives: [],
          tactics: [],
          budget: {
            total: "$0",
            breakdown: {}
          },
          timeline: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: []
          },
          targetAudiences: {
            primary: [],
            secondary: [],
            untapped: []
          },
          channels: [],
          messaging: {
            uniqueValue: "",
            keyPoints: [],
            callToAction: ""
          }
        }
      };

      // Get actual recommendations if service is available
      const serviceResult = await service.generateRecommendations(analysisData);
      
      // Merge the received results with our placeholder structure to ensure all properties exist
      const result = { ...mockResult, ...serviceResult };
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
      // Use the generic 'from' method instead of trying to reference a specific table
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


import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type Recommendations, type AnalysisResult } from '@/types/recommendations';
import { type BusinessType } from '@/types/businessTypes';
import { type AIProvider } from '@/components/AIProviderToggle';
import { RecommendationService } from '@/services/recommendationService';
import { enhancedDataAnalysisService } from '@/services/dataAnalysis/enhancedDataAnalysisService';

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
  const [generatingMessage, setGeneratingMessage] = useState<string>('');
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
    setGeneratingMessage('Preparing data for analysis...');

    try {
      const service = new RecommendationService();
      service.setProvider(provider);

      // Map the review data to match what the service expects
      setGeneratingMessage('Processing reviews...');
      const mappedReviews = businessData.reviews.map((review: any) => ({
        rating: review.stars || 0,
        stars: review.stars || 0,
        text: review.text || review.comment || '',
        owner_response: review.responseFromOwnerText || null,
        sentiment: review.sentiment || 'neutral',
        mainThemes: review.mainThemes || '',
        staffMentioned: review.staffMentioned || '',
        publishedAtDate: review.publishedAtDate || new Date().toISOString(),
        reviewUrl: review.reviewUrl || '',
        // Keep other properties
        ...review
      }));

      // Perform enhanced data analysis
      setGeneratingMessage('Analyzing temporal patterns...');
      const enhancedAnalysis = await enhancedDataAnalysisService.analyzeData(mappedReviews);

      // Calculate metrics properly
      const totalReviews = mappedReviews.length;
      const avgRating = totalReviews > 0 
        ? mappedReviews.reduce((sum: number, r: any) => sum + (r.stars || 0), 0) / totalReviews
        : 0;
      const responseRate = totalReviews > 0
        ? mappedReviews.filter((r: any) => r.owner_response).length / totalReviews
        : 0;

      // Calculate sentiment analysis from the reviews
      setGeneratingMessage('Analyzing sentiment...');
      const sentimentCounts = mappedReviews.reduce((acc: any, review: any) => {
        const sentiment = review.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      }, { positive: 0, neutral: 0, negative: 0 });

      // Extract staff mentions with null checks
      const staffMentions: any[] = [];
      mappedReviews.forEach((review: any) => {
        if (review.staffMentioned && typeof review.staffMentioned === 'string') {
          const staffNames = review.staffMentioned.split(',').map((name: string) => name.trim());
          staffNames.forEach((name: string) => {
            if (name) {
              const existing = staffMentions.find(s => s.name === name);
              if (existing) {
                existing.count++;
                if (review.sentiment === 'negative') existing.sentiment = 'negative';
                else if (review.sentiment === 'positive' && existing.sentiment !== 'negative') existing.sentiment = 'positive';
              } else {
                staffMentions.push({
                  name,
                  count: 1,
                  sentiment: review.sentiment || 'neutral'
                });
              }
            }
          });
        }
      });

      // Extract common terms from themes with null checks
      setGeneratingMessage('Identifying patterns and themes...');
      const commonTerms: any[] = [];
      const themeFrequency: any = {};
      mappedReviews.forEach((review: any) => {
        if (review.mainThemes && typeof review.mainThemes === 'string') {
          const themes = review.mainThemes.split(',').map((theme: string) => theme.trim());
          themes.forEach((theme: string) => {
            if (theme) {
              themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
            }
          });
        }
      });

      Object.entries(themeFrequency).forEach(([theme, count]) => {
        if (theme) {
          commonTerms.push({ text: theme, count: count as number });
        }
      });

      // Sort common terms by frequency
      commonTerms.sort((a, b) => b.count - a.count);

      // Prepare analysis data with the correct structure including enhanced analysis
      const analysisData: AnalysisResult = {
        sentimentAnalysis: [
          { name: 'Positive', value: sentimentCounts.positive },
          { name: 'Neutral', value: sentimentCounts.neutral },
          { name: 'Negative', value: sentimentCounts.negative }
        ],
        staffMentions: staffMentions,
        commonTerms: commonTerms.slice(0, 20), // Top 20 terms
        overallAnalysis: `Analysis of ${totalReviews} reviews for ${selectedBusiness} with an average rating of ${avgRating.toFixed(1)} stars.`,
        mainThemes: commonTerms.slice(0, 10).map(term => ({
          theme: term.text,
          count: term.count,
          percentage: (term.count / totalReviews) * 100
        })),
        ratingBreakdown: [1, 2, 3, 4, 5].map(rating => {
          const count = mappedReviews.filter((r: any) => r.stars === rating).length;
          return {
            rating,
            count,
            percentage: (count / totalReviews) * 100
          };
        }),
        // Add enhanced analysis data
        temporalPatterns: enhancedAnalysis.temporalPatterns,
        historicalTrends: enhancedAnalysis.historicalTrends,
        reviewClusters: enhancedAnalysis.reviewClusters,
        seasonalAnalysis: enhancedAnalysis.seasonalAnalysis,
        insights: enhancedAnalysis.insights
      };

      console.log('Analysis Data Structure:', analysisData); // Debug log

      // Get actual recommendations from the service
      setGeneratingMessage(provider === 'api' ? 'Generating recommendations with AI...' : 'Generating recommendations...');
      const result = await service.generateRecommendations({
        ...analysisData,
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
      });
      
      setRecommendations(result);
      setGeneratingMessage('');
      
      toast({
        title: "Success",
        description: "Recommendations generated successfully with enhanced analysis",
      });
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      setGeneratingMessage('');
      
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
    generatingMessage,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
  };
};

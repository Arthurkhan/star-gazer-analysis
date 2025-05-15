import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRecommendations } from "@/hooks/useRecommendations";
import { detectBusinessType } from "@/utils/businessTypeDetection";
import { type AIProvider } from "@/components/AIProviderToggle";
import { Sparkles, Download, Save } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [aiProvider, setAiProvider] = useState<AIProvider>("browser");
  
  const { 
    loading, 
    selectedBusiness, 
    businessData, 
    getFilteredReviews, 
    getChartData,
    handleBusinessChange 
  } = useDashboardData();

  const filteredReviews = getFilteredReviews();

  // Detect business type based on business data
  const businessType = useMemo(() => {
    if (!businessData || !filteredReviews) return null;
    return detectBusinessType({ ...businessData, reviews: filteredReviews });
  }, [businessData, filteredReviews]);

  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
  } = useRecommendations({
    businessData: { ...businessData, reviews: filteredReviews },
    selectedBusiness,
    businessType: businessType || detectBusinessType({}),
  });
  
  const handleGenerateRecommendations = useCallback(() => {
    generateRecommendations(aiProvider);
  }, [generateRecommendations, aiProvider]);

  return (
    <DashboardLayout onProviderChange={setAiProvider}>
      <div className="flex justify-between items-center gap-4 mb-6 w-full">
        <BusinessSelector
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          businessData={businessData}
          businessType={businessType}
          className="flex-1"
        />
        <Button
          onClick={handleGenerateRecommendations}
          disabled={!selectedBusiness || recommendationsLoading}
          size="icon"
          className="w-10 h-10"
          title="Generate Recommendations"
        >
          <Sparkles className="w-5 h-5" />
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview & Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <DashboardContent
            loading={loading}
            reviews={filteredReviews}
            chartData={getChartData(filteredReviews)}
          />
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-6">
          {recommendations && (
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={exportRecommendations}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveRecommendations}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          )}
          <RecommendationsDashboard
            recommendations={recommendations}
            loading={recommendationsLoading}
            error={recommendationsError || undefined}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Dashboard;

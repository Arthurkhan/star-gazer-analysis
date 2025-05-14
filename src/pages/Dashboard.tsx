import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import { AIProviderToggle } from "@/components/AIProviderToggle";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRecommendations } from "@/hooks/useRecommendations";
import { BusinessType } from "@/types/recommendations";
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

  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
  } = useRecommendations({
    businessData,
    selectedBusiness,
    businessType: BusinessType.RESTAURANT, // This should be dynamic based on business
  });

  const filteredReviews = getFilteredReviews();
  
  const handleGenerateRecommendations = useCallback(() => {
    generateRecommendations(aiProvider);
  }, [generateRecommendations, aiProvider]);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6 w-full">
        <BusinessSelector
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          businessData={businessData}
        />
        <div className="flex items-center gap-4">
          <AIProviderToggle onProviderChange={setAiProvider} />
          <Button
            onClick={handleGenerateRecommendations}
            disabled={!selectedBusiness || recommendationsLoading}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Recommendations
          </Button>
        </div>
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

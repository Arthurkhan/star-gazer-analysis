
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import { ApiKeyStatus } from "@/components/ApiKeyStatus";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";
import MonthlyReviewsChart from "@/components/review-analysis/MonthlyReviewsChart";

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    loading, 
    selectedBusiness, 
    businessData, 
    getFilteredReviews, 
    getChartData,
    handleBusinessChange 
  } = useDashboardData();

  const filteredReviews = getFilteredReviews();
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-full">
        <BusinessSelector
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          businessData={businessData}
        />
      </div>
      
      <DashboardContent
        loading={loading}
        reviews={filteredReviews}
        chartData={getChartData(filteredReviews)}
      />
      
      {/* Cumulative Reviews Chart */}
      {!loading && (
        <div className="mt-6">
          <MonthlyReviewsChart reviews={filteredReviews} className="w-full" />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;

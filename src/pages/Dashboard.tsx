
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import { ApiKeyStatus } from "@/components/ApiKeyStatus";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";

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

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-full">
        <BusinessSelector
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          businessData={businessData}
        />
      </div>
      
      {/* Add API Key Status Alert */}
      <ApiKeyStatus />
      
      <DashboardContent
        loading={loading}
        reviews={getFilteredReviews()}
        chartData={getChartData(getFilteredReviews())}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

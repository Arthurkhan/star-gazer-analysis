
import React from "react";
import { Review } from "@/types/reviews";
import OverviewSection from "@/components/OverviewSection";
import ReviewsChart from "@/components/ReviewsChart";
import MonthlyReviewsChart from "@/components/review-analysis/MonthlyReviewsChart";
import AllReviewsAiAnalysis from "@/components/AllReviewsAiAnalysis";
import ReviewAnalysis from "@/components/review-analysis/ReviewAnalysis";
import KeyInsights from "@/components/KeyInsights";
import ReviewsTable from "@/components/ReviewsTable";

interface AllReviewsContentProps {
  reviews: Review[];
  chartData: any[];
}

const AllReviewsContent: React.FC<AllReviewsContentProps> = ({ reviews, chartData }) => {
  return (
    <>
      <OverviewSection reviews={reviews} />
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <ReviewsChart data={chartData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <MonthlyReviewsChart reviews={reviews} />
      </div>
      <div className="mb-6">
        <AllReviewsAiAnalysis reviews={reviews} />
      </div>
      <div className="grid grid-cols-1 gap-6 mb-6">
        <ReviewAnalysis reviews={reviews} />
        <KeyInsights reviews={reviews} />
      </div>
      <ReviewsTable reviews={reviews} />
    </>
  );
};

export default AllReviewsContent;

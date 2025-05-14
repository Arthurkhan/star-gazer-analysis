
import React from "react";
import { Review } from "@/types/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AllReviewsAiAnalysisProps {
  reviews: Review[];
}

const AllReviewsAiAnalysis: React.FC<AllReviewsAiAnalysisProps> = ({ reviews }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Review Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center text-muted-foreground py-4">
          AI analysis has been disabled.
        </div>
      </CardContent>
    </Card>
  );
};

export default AllReviewsAiAnalysis;

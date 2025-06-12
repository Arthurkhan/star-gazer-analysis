import { Review } from "@/types/reviews";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Eye, Star, MessageSquare, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MobileReviewCardProps {
  review: Review;
  onViewFull: (review: Review) => void;
}

const MobileReviewCard = ({ review, onViewFull }: MobileReviewCardProps) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  const getStarDisplay = (stars: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < stars
            ? "fill-yellow-500 text-yellow-500"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{review.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">{getStarDisplay(review.stars)}</div>
              <span className="text-xs text-muted-foreground">
                {formatDate(review.publishedAtDate)}
              </span>
            </div>
          </div>
          {review.responseFromOwnerText && (
            <Badge variant="secondary" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Replied
            </Badge>
          )}
        </div>

        {/* Review Text */}
        <div className="mb-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {truncateText(review.textTranslated || review.text || "")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewFull(review)}
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Full
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(review.reviewUrl, "_blank")}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface MobileReviewsListProps {
  reviews: Review[];
  onViewFull: (review: Review) => void;
}

export const MobileReviewsList = ({ reviews, onViewFull }: MobileReviewsListProps) => {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews found matching your filters
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {reviews.map((review, index) => (
        <MobileReviewCard
          key={index}
          review={review}
          onViewFull={onViewFull}
        />
      ))}
    </div>
  );
};

export default MobileReviewCard;

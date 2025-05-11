
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Review } from "@/types/reviews";
import { formatDistanceToNow } from "date-fns";
import { Search, Eye } from "lucide-react";

interface ReviewsTableProps {
  reviews: Review[];
}

const ReviewsTable = ({ reviews }: ReviewsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterTimeframe, setFilterTimeframe] = useState("all");
  const [filterResponse, setFilterResponse] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const reviewsPerPage = 10;
  
  // Apply filters and sorting when dependencies change
  useEffect(() => {
    let results = [...reviews];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (review) => 
          review.text.toLowerCase().includes(term) ||
          (review.translatedText && review.translatedText.toLowerCase().includes(term)) ||
          review.name.toLowerCase().includes(term)
      );
    }
    
    // Apply rating filter
    if (filterRating !== "all") {
      results = results.filter(
        (review) => review.star === parseInt(filterRating)
      );
    }
    
    // Apply timeframe filter
    if (filterTimeframe !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filterTimeframe) {
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "3months":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "6months":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "1year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      results = results.filter(
        (review) => new Date(review.publishedAtDate) >= cutoffDate
      );
    }
    
    // Apply response filter
    if (filterResponse !== "all") {
      if (filterResponse === "yes") {
        results = results.filter(
          (review) => !!review.responseFromOwnerText?.trim()
        );
      } else {
        results = results.filter(
          (review) => !review.responseFromOwnerText?.trim()
        );
      }
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.publishedAtDate).getTime();
        const dateB = new Date(b.publishedAtDate).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else if (sortBy === "rating") {
        return sortOrder === "desc" ? b.star - a.star : a.star - b.star;
      } else {
        // Default to date sorting
        const dateA = new Date(a.publishedAtDate).getTime();
        const dateB = new Date(b.publishedAtDate).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }
    });
    
    setFilteredReviews(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [reviews, searchTerm, filterRating, filterTimeframe, filterResponse, sortBy, sortOrder]);
  
  // Calculate pagination
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  
  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return "Unknown date";
    }
  };
  
  // Toggle sort order
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc"); // Default to descending when changing columns
    }
  };
  
  // Open dialog with full review
  const openReviewDialog = (review: Review) => {
    setSelectedReview(review);
    setIsDialogOpen(true);
  };
  
  return (
    <Card className="shadow-md border-0 dark:bg-gray-800 mb-8">
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
        <CardDescription>
          {filteredReviews.length} reviews match your filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 flex-wrap md:flex-nowrap">
              <Select
                value={filterRating}
                onValueChange={setFilterRating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="5">5 stars</SelectItem>
                  <SelectItem value="4">4 stars</SelectItem>
                  <SelectItem value="3">3 stars</SelectItem>
                  <SelectItem value="2">2 stars</SelectItem>
                  <SelectItem value="1">1 star</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterTimeframe}
                onValueChange={setFilterTimeframe}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterResponse}
                onValueChange={setFilterResponse}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reviews</SelectItem>
                  <SelectItem value="yes">Has response</SelectItem>
                  <SelectItem value="no">No response</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort("rating")}
                  >
                    Rating {sortBy === "rating" && (sortOrder === "desc" ? "↓" : "↑")}
                  </TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort("date")}
                  >
                    Date {sortBy === "date" && (sortOrder === "desc" ? "↓" : "↑")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentReviews.length > 0 ? (
                  currentReviews.map((review, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-star">
                          {"★".repeat(review.star)}
                          {"☆".repeat(5 - review.star)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {review.name}
                        <div className="text-xs text-gray-500">
                          {review.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {review.translatedText || review.text}
                        </div>
                        {review.responseFromOwnerText && (
                          <div className="mt-1 text-xs text-gray-500 italic max-w-md truncate">
                            Response: {review.responseFromOwnerText}
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 flex items-center gap-1 text-xs"
                          onClick={() => openReviewDialog(review)}
                        >
                          <Eye className="h-3 w-3" /> View Full Review
                        </Button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(review.publishedAtDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ···
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(review.reviewUrl, "_blank")}
                            >
                              View Original
                            </DropdownMenuItem>
                            {!review.responseFromOwnerText && (
                              <DropdownMenuItem>
                                Draft Response
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                      No reviews found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstReview + 1} to{" "}
                {Math.min(indexOfLastReview, filteredReviews.length)} of{" "}
                {filteredReviews.length} reviews
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Full Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-star">
                {selectedReview && "★".repeat(selectedReview.star)}
                {selectedReview && "☆".repeat(5 - (selectedReview?.star || 0))}
              </span>
              {selectedReview?.name}'s Review
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.title} - {selectedReview && formatDate(selectedReview.publishedAtDate)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Original language review text */}
            <div className="space-y-2">
              <h3 className="font-medium">Original Review:</h3>
              <p className="text-sm whitespace-pre-line bg-gray-50 dark:bg-gray-900 p-3 rounded-md border">
                {selectedReview?.text}
              </p>
            </div>
            
            {/* Translated text when available */}
            {selectedReview?.translatedText && (
              <div className="space-y-2">
                <h3 className="font-medium">Translated Review:</h3>
                <p className="text-sm whitespace-pre-line bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                  {selectedReview.translatedText}
                </p>
              </div>
            )}
            
            {/* Owner's response when available */}
            {selectedReview?.responseFromOwnerText && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-medium flex items-center">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full mr-2">Owner Response</span>
                </h3>
                <p className="text-sm whitespace-pre-line bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-100 dark:border-green-900">
                  {selectedReview?.responseFromOwnerText}
                </p>
              </div>
            )}
            
            {/* Additional review metadata */}
            <div className="pt-2 mt-4 border-t">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Review Date:</span> {selectedReview && new Date(selectedReview.publishedAtDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Original Language:</span> {selectedReview?.originalLanguage || "Unknown"}
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              {selectedReview?.reviewUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(selectedReview.reviewUrl, "_blank")}
                >
                  View Original Source
                </Button>
              )}
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ReviewsTable;

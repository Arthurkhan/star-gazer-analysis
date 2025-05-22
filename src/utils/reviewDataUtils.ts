/**
 * Phase 4 Optimized Utils - Removed complex caching for small datasets
 * Direct array operations instead of complex algorithms
 */
export const calculateBusinessStats = (reviews: Review[], totalCount: number) => {
  if (!reviews || reviews.length === 0) return {};

  // Simple direct calculation instead of complex caching
  const businessGroups = reviews.reduce((acc, review) => {
    const businessName = review.businessName || review.title || 'Unknown';
    if (!acc[businessName]) {
      acc[businessName] = [];
    }
    acc[businessName].push(review);
    return acc;
  }, {} as Record<string, Review[]>);

  const stats: Record<string, any> = {};
  
  Object.entries(businessGroups).forEach(([businessName, businessReviews]) => {
    stats[businessName] = {
      name: businessName,
      count: businessReviews.length,
      averageRating: businessReviews.reduce((sum, r) => sum + (r.stars || 0), 0) / businessReviews.length,
      lastReviewDate: businessReviews.reduce((latest, r) => {
        const reviewDate = new Date(r.publishedAtDate || r.publishedatdate || 0);
        return reviewDate > latest ? reviewDate : latest;
      }, new Date(0))
    };
  });

  return stats;
};
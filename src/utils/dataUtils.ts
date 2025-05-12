export const calculateAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  const totalStars = reviews.reduce((sum, review) => sum + review.star, 0);
  return totalStars / reviews.length;
};

export const countReviewsByRating = (reviews) => {
  const ratingCounts = {};
  reviews.forEach(review => {
    ratingCounts[review.star] = (ratingCounts[review.star] || 0) + 1;
  });
  return ratingCounts;
};

export const groupReviewsByMonth = (reviews) => {
  const today = new Date();
  const months = [];
  
  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
    months.push({
      month: monthName,
      count: 0,
      cumulativeCount: 0 // Add the missing property
    });
  }
  
  // Count reviews for each month
  reviews.forEach(review => {
    const reviewDate = new Date(review.publishedAtDate);
    
    // Check if date is valid and within last 12 months
    if (
      !isNaN(reviewDate.getTime()) && 
      reviewDate >= new Date(today.getFullYear(), today.getMonth() - 11, 1) &&
      reviewDate <= today
    ) {
      const monthKey = reviewDate.toLocaleString('default', { month: 'short' }) + ' ' + reviewDate.getFullYear();
      const monthObj = months.find(m => m.month === monthKey);
      if (monthObj) {
        monthObj.count++;
      }
    }
  });
  
  // Calculate cumulative counts
  let cumulativeCount = 0;
  months.forEach(month => {
    cumulativeCount += month.count;
    month.cumulativeCount = cumulativeCount;
  });
  
  return months;
};

export const calculateMonthlyComparison = (reviews) => {
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const currentMonthReviews = reviews.filter(
    (review) => new Date(review.publishedAtDate) >= currentMonthStart
  );

  const lastMonthReviews = reviews.filter(
    (review) =>
      new Date(review.publishedAtDate) >= lastMonthStart &&
      new Date(review.publishedAtDate) < currentMonthStart
  );

  const currentMonthCount = currentMonthReviews.length;
  const lastMonthCount = lastMonthReviews.length;
  const vsLastMonth = currentMonthCount - lastMonthCount;

  return {
    currentMonthCount,
    lastMonthCount,
    vsLastMonth,
  };
};


import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Review } from '@/types/reviews';
import { formatDistanceToNow } from 'date-fns';

// Function to calculate average rating from reviews
const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.star, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
};

// Function to count ratings by star count
const countRatingsByStars = (reviews: Review[]): Record<number, number> => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  reviews.forEach(review => {
    if (review.star >= 1 && review.star <= 5) {
      counts[review.star]++;
    }
  });
  
  return counts;
};

// Function to get distribution of reviews over time (last 6 months)
const getReviewsOverTime = (reviews: Review[]): { month: string; count: number }[] => {
  const now = new Date();
  const lastSixMonths: { month: string; count: number }[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const monthName = d.toLocaleString('default', { month: 'short' });
    lastSixMonths.push({
      month: `${monthName} ${d.getFullYear()}`,
      count: 0
    });
  }
  
  reviews.forEach(review => {
    const reviewDate = new Date(review.publishedAtDate);
    if (reviewDate > new Date(now.setMonth(now.getMonth() - 6))) {
      const monthIdx = 5 - Math.floor((now.getTime() - reviewDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      if (monthIdx >= 0 && monthIdx < 6) {
        lastSixMonths[monthIdx].count++;
      }
    }
  });
  
  return lastSixMonths;
};

// Generate insights section content
const generateInsights = (reviews: Review[]): string => {
  const totalReviews = reviews.length;
  if (totalReviews === 0) return "No reviews available for insights.";
  
  const avgRating = calculateAverageRating(reviews);
  const ratingsCount = countRatingsByStars(reviews);
  const positiveRatings = ratingsCount[4] + ratingsCount[5];
  const positivePercentage = Math.round((positiveRatings / totalReviews) * 100);
  
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthReviews = reviews.filter(r => new Date(r.publishedAtDate) >= lastMonth).length;
  
  return `
    Average Rating: ${avgRating} out of 5 stars
    Total Reviews: ${totalReviews}
    Positive Reviews: ${positivePercentage}% (${positiveRatings} reviews are 4-5 stars)
    Reviews Last Month: ${lastMonthReviews}
    
    Distribution:
    5★: ${ratingsCount[5]} (${Math.round((ratingsCount[5]/totalReviews)*100)}%)
    4★: ${ratingsCount[4]} (${Math.round((ratingsCount[4]/totalReviews)*100)}%)
    3★: ${ratingsCount[3]} (${Math.round((ratingsCount[3]/totalReviews)*100)}%)
    2★: ${ratingsCount[2]} (${Math.round((ratingsCount[2]/totalReviews)*100)}%)
    1★: ${ratingsCount[1]} (${Math.round((ratingsCount[1]/totalReviews)*100)}%)
  `;
};

// Main export function
export const exportToPDF = (reviews: Review[], businessName: string = "All Businesses"): void => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Google Maps Review Analysis Report', pageWidth / 2, 20, { align: 'center' });
  
  // Add business name
  doc.setFontSize(16);
  doc.text(businessName, pageWidth / 2, 30, { align: 'center' });
  
  // Add date
  doc.setFontSize(12);
  doc.setTextColor(100);
  const today = new Date().toLocaleDateString();
  doc.text(`Generated on: ${today}`, pageWidth / 2, 40, { align: 'center' });
  doc.setTextColor(0);
  
  // Add overview section
  doc.setFontSize(16);
  doc.text('Overview', 14, 55);
  
  // Add overview data
  doc.setFontSize(12);
  const avgRating = calculateAverageRating(reviews);
  const totalReviews = reviews.length;
  
  autoTable(doc, {
    startY: 60,
    head: [['Metric', 'Value']],
    body: [
      ['Total Reviews', totalReviews.toString()],
      ['Average Rating', avgRating.toString()],
      ['Business Name', businessName]
    ],
    theme: 'grid',
    headStyles: { fillColor: [66, 135, 245] }
  });
  
  // Add insights section
  doc.setFontSize(16);
  doc.text('Key Insights', 14, doc.lastAutoTable.finalY + 15);
  
  // Add insights content
  doc.setFontSize(10);
  const insights = generateInsights(reviews);
  const insightLines = doc.splitTextToSize(insights, pageWidth - 30);
  doc.text(insightLines, 14, doc.lastAutoTable.finalY + 25);
  
  // Add rating distribution chart (simplified as a table)
  const startY = doc.lastAutoTable.finalY + 15 + insightLines.length * 7;
  const ratingCounts = countRatingsByStars(reviews);
  
  doc.setFontSize(16);
  doc.text('Rating Distribution', 14, startY);
  
  const ratingData: any[] = [];
  Object.entries(ratingCounts).forEach(([rating, count]) => {
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    ratingData.push([`${rating} Star Reviews`, count, `${percentage}%`]);
  });
  
  autoTable(doc, {
    startY: startY + 5,
    head: [['Rating', 'Count', 'Percentage']],
    body: ratingData,
    theme: 'grid',
    headStyles: { fillColor: [66, 135, 245] }
  });
  
  // Add monthly trend data
  doc.setFontSize(16);
  doc.text('Monthly Review Trends', 14, doc.lastAutoTable.finalY + 15);
  
  const monthlyData = getReviewsOverTime(reviews);
  const monthlyRows = monthlyData.map(item => [item.month, item.count.toString()]);
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Month', 'Number of Reviews']],
    body: monthlyRows,
    theme: 'grid',
    headStyles: { fillColor: [66, 135, 245] }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Google Maps Review Analyzer - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`${businessName.replace(/\s+/g, '_')}_Review_Analysis_${today.replace(/\//g, '-')}.pdf`);
};

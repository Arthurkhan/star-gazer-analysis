import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Review } from '@/types/reviews';
import { formatDistanceToNow } from 'date-fns';
import { 
  calculateAverageRating, 
  countReviewsByRating,
  groupReviewsByMonth,
  analyzeReviewSentiment_sync, 
  countReviewsByLanguage, 
  extractStaffMentions_sync,
  extractCommonTerms_sync
} from '@/utils/dataUtils';

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

// Define a type for the return value of autoTable that includes finalY
interface AutoTableOutput {
  finalY?: number;
  [key: string]: any;
}

// Main export function - now without AI report option
export const exportToPDF = async (
  reviews: Review[], 
  businessName: string = "All Businesses", 
  dateRange?: { startDate: Date; endDate: Date }
): Promise<void> => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Filter reviews by date range if provided
  let filteredReviews = reviews;
  let dateRangeText = "";
  
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    filteredReviews = reviews.filter(review => {
      const reviewDate = new Date(review.publishedAtDate);
      return reviewDate >= startDate && reviewDate <= endDate;
    });
    
    dateRangeText = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  }
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Google Maps Review Analysis`, pageWidth / 2, 20, { align: 'center' });
  
  // Add business name
  doc.setFontSize(16);
  doc.text(businessName, pageWidth / 2, 30, { align: 'center' });
  
  // Add date and range information
  doc.setFontSize(12);
  doc.setTextColor(100);
  const today = new Date().toLocaleDateString();
  doc.text(`Generated on: ${today}`, pageWidth / 2, 40, { align: 'center' });
  
  if (dateRangeText) {
    doc.text(`Date Range: ${dateRangeText}`, pageWidth / 2, 48, { align: 'center' });
  }
  
  doc.setTextColor(0);
  
  // Keep track of the last Y position
  let currentY = dateRangeText ? 58 : 50;
  
  // ----- OVERVIEW SECTION -----
  doc.setFontSize(16);
  doc.text('Overview', 14, currentY);
  currentY += 10;
  
  const totalReviews = filteredReviews.length;
  const averageRating = calculateAverageRating(filteredReviews);
  const reviewsByRating = countReviewsByRating(filteredReviews);
  
  // Create a grid for the overview cards
  const cardWidth = (pageWidth - 30) / 3;
  
  // Total Reviews Card
  doc.setFillColor(248, 250, 252); // Light background for card
  doc.roundedRect(14, currentY, cardWidth - 4, 40, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Total Reviews', 20, currentY + 10);
  doc.setFontSize(20);
  doc.text(totalReviews.toString(), 20, currentY + 25);
  
  // Average Rating Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + cardWidth, currentY, cardWidth - 4, 40, 3, 3, 'F');
  doc.setFontSize(12);
  doc.text('Average Rating', 20 + cardWidth, currentY + 10);
  doc.setFontSize(20);
  doc.text(averageRating.toFixed(1), 20 + cardWidth, currentY + 25);
  
  // Rating Distribution Card (simplified)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + cardWidth * 2, currentY, cardWidth - 4, 40, 3, 3, 'F');
  doc.setFontSize(12);
  doc.text('Rating Distribution', 20 + cardWidth * 2, currentY + 10);
  
  // Move below the cards
  currentY += 50;
  
  // ----- REVIEWS CHART -----
  doc.setFontSize(16);
  doc.text('Reviews Timeline', 14, currentY);
  currentY += 10;
  
  // Create a simplified chart representation
  const monthlyData = groupReviewsByMonth(filteredReviews);
  const chartData = [];
  
  for (const item of monthlyData) {
    chartData.push([item.month, item.count.toString()]);
  }
  
  const chartResult = autoTable(doc, {
    startY: currentY,
    head: [['Month', 'Reviews']],
    body: chartData,
    theme: 'grid',
    headStyles: { fillColor: [66, 135, 245] },
    margin: { left: 14, right: 14 }
  }) as unknown as AutoTableOutput;
  
  // Update the current Y position
  currentY = (chartResult?.finalY || currentY) + 20;
  
  // ----- REVIEW ANALYSIS -----
  doc.setFontSize(16);
  doc.text('Review Analysis', 14, currentY);
  currentY += 10;
  
  // Sentiment Analysis
  const sentimentData = analyzeReviewSentiment_sync(filteredReviews);
  const sentimentRows = sentimentData.map(item => [item.name, item.value.toString()]);
  
  const sentimentResult = autoTable(doc, {
    startY: currentY,
    head: [['Sentiment', 'Count']],
    body: sentimentRows,
    theme: 'grid',
    headStyles: { fillColor: [66, 135, 245] },
    margin: { left: 14, right: 14 }
  }) as unknown as AutoTableOutput;
  
  // Update the current Y position
  currentY = (sentimentResult?.finalY || currentY) + 15;
  
  // Top Languages
  doc.setFontSize(14);
  doc.text('Review Languages', 14, currentY);
  currentY += 10;
  
  const languageData = countReviewsByLanguage(filteredReviews);
  const languageRows = languageData.map(item => [item.name, item.value.toString()]);
  
  const languageResult = autoTable(doc, {
    startY: currentY,
    head: [['Language', 'Count']],
    body: languageRows,
    theme: 'grid',
    headStyles: { fillColor: [66, 135, 245] },
    margin: { left: 14, right: 14 }
  }) as unknown as AutoTableOutput;
  
  // Update the current Y position
  currentY = (languageResult?.finalY || currentY) + 15;
  
  // Staff Mentions
  doc.setFontSize(14);
  doc.text('Staff Mentioned in Reviews', 14, currentY);
  currentY += 10;
  
  const staffMentions = extractStaffMentions_sync(filteredReviews);
  const staffRows = staffMentions.map(item => [
    item.name, 
    item.count.toString(), 
    item.sentiment,
    item.examples ? item.examples.join(", ").substring(0, 120) + (item.examples.join(", ").length > 120 ? "..." : "") : ""
  ]);
  
  if (staffRows.length > 0) {
    const staffResult = autoTable(doc, {
      startY: currentY,
      head: [['Name', 'Mentions', 'Sentiment', 'Example Contexts']],
      body: staffRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245] },
      margin: { left: 14, right: 14 }
    }) as unknown as { finalY?: number };
    
    currentY = (staffResult?.finalY || currentY) + 15;
  } else {
    doc.setFontSize(12);
    doc.text("No staff mentions found", 14, currentY + 10);
    currentY += 20;
  }
  
  // Common Terms
  doc.setFontSize(14);
  doc.text('Common Terms', 14, currentY);
  currentY += 10;
  
  const commonTerms = extractCommonTerms_sync(filteredReviews);
  const termRows = commonTerms.slice(0, 10).map(item => [
    item.text, 
    item.count.toString(), 
    item.category || "General",
    `${((item.count / filteredReviews.length) * 100).toFixed(1)}%`
  ]);
  
  if (termRows.length > 0) {
    const termsResult = autoTable(doc, {
      startY: currentY,
      head: [['Term', 'Count', 'Category', '% of Reviews']],
      body: termRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245] },
      margin: { left: 14, right: 14 }
    }) as unknown as AutoTableOutput;
    
    currentY = (termsResult?.finalY || currentY) + 15;
  } else {
    doc.setFontSize(12);
    doc.text("No common terms found", 14, currentY + 10);
    currentY += 20;
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Google Maps Review Analysis - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF with appropriate filename
  const dateRangeSuffix = dateRangeText ? `_${dateRangeText.replace(/\//g, '-').replace(/ to /g, '_to_')}` : '';
  doc.save(`${businessName.replace(/\s+/g, '_')}_Dashboard${dateRangeSuffix}_${today.replace(/\//g, '-')}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Review } from '@/types/reviews';

interface ExportPeriodComparisonOptions {
  businessName: string;
  currentPeriod: {
    from: Date;
    to: Date;
    reviews: Review[];
  };
  previousPeriod: {
    from: Date;
    to: Date;
    reviews: Review[];
  };
  comparisonResult: any;
}

export function exportPeriodComparisonReport({
  businessName,
  currentPeriod,
  previousPeriod,
  comparisonResult
}: ExportPeriodComparisonOptions) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Period Comparison Report', 20, 20);
  
  // Business Name
  doc.setFontSize(16);
  doc.text(businessName, 20, 35);
  
  // Date ranges
  doc.setFontSize(10);
  doc.text(`Current Period: ${format(currentPeriod.from, 'MMM dd, yyyy')} - ${format(currentPeriod.to, 'MMM dd, yyyy')}`, 20, 50);
  doc.text(`Previous Period: ${format(previousPeriod.from, 'MMM dd, yyyy')} - ${format(previousPeriod.to, 'MMM dd, yyyy')}`, 20, 57);
  
  // Summary metrics
  doc.setFontSize(14);
  doc.text('Key Metrics', 20, 75);
  
  autoTable(doc, {
    startY: 80,
    head: [['Metric', 'Previous Period', 'Current Period', 'Change']],
    body: [
      [
        'Average Rating',
        previousPeriod.reviews.length > 0 
          ? (previousPeriod.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / previousPeriod.reviews.filter(r => r.stars).length).toFixed(2)
          : 'N/A',
        currentPeriod.reviews.length > 0 
          ? (currentPeriod.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / currentPeriod.reviews.filter(r => r.stars).length).toFixed(2)
          : 'N/A',
        `${comparisonResult.ratingChange > 0 ? '+' : ''}${comparisonResult.ratingChange.toFixed(2)}`
      ],
      [
        'Review Count',
        previousPeriod.reviews.length.toString(),
        currentPeriod.reviews.length.toString(),
        `${comparisonResult.reviewCountChange > 0 ? '+' : ''}${comparisonResult.reviewCountChange} (${comparisonResult.reviewCountChangePercent.toFixed(1)}%)`
      ],
      [
        'Sentiment Score',
        comparisonResult.previousSentimentScore?.toFixed(2) || 'N/A',
        comparisonResult.currentSentimentScore?.toFixed(2) || 'N/A',
        `${comparisonResult.sentimentChange > 0 ? '+' : ''}${comparisonResult.sentimentChange.toFixed(2)}`
      ]
    ]
  });
  
  // Theme Analysis
  const currentY = (doc as any).autoTable.previous.finalY + 20;
  doc.setFontSize(14);
  doc.text('Theme Analysis', 20, currentY);
  
  if (comparisonResult.improvingThemes.length > 0 || comparisonResult.decliningThemes.length > 0) {
    const themeData = [];
    
    if (comparisonResult.improvingThemes.length > 0) {
      themeData.push(['Improving Themes', comparisonResult.improvingThemes.join(', ')]);
    }
    
    if (comparisonResult.decliningThemes.length > 0) {
      themeData.push(['Declining Themes', comparisonResult.decliningThemes.join(', ')]);
    }
    
    if (comparisonResult.newThemes.length > 0) {
      themeData.push(['New Themes', comparisonResult.newThemes.join(', ')]);
    }
    
    if (comparisonResult.removedThemes.length > 0) {
      themeData.push(['Removed Themes', comparisonResult.removedThemes.join(', ')]);
    }
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Category', 'Themes']],
      body: themeData,
      columnStyles: {
        1: { cellWidth: 140 }
      }
    });
  }
  
  // Staff Performance (if applicable)
  if (Object.keys(comparisonResult.staffPerformanceChanges).length > 0) {
    const staffY = (doc as any).autoTable.previous.finalY + 20;
    doc.setFontSize(14);
    doc.text('Staff Performance Changes', 20, staffY);
    
    const staffData = Object.entries(comparisonResult.staffPerformanceChanges)
      .sort(([_, a], [__, b]) => b - a)
      .map(([name, change]) => [
        name,
        change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
        change > 0.05 ? 'Improved' : change < -0.05 ? 'Declined' : 'Stable'
      ]);
    
    autoTable(doc, {
      startY: staffY + 5,
      head: [['Staff Member', 'Sentiment Change', 'Status']],
      body: staffData
    });
  }
  
  // Insights
  const insightsY = (doc as any).autoTable.previous ? (doc as any).autoTable.previous.finalY + 20 : currentY + 100;
  doc.setFontSize(14);
  doc.text('Key Insights', 20, insightsY);
  
  doc.setFontSize(10);
  let textY = insightsY + 10;
  
  // Overall performance
  const performanceText = comparisonResult.ratingChange > 0 
    ? `Ratings improved by ${comparisonResult.ratingChange.toFixed(2)} stars`
    : comparisonResult.ratingChange < 0
    ? `Ratings declined by ${Math.abs(comparisonResult.ratingChange).toFixed(2)} stars`
    : 'Ratings remained stable';
    
  const volumeText = comparisonResult.reviewCountChange > 0
    ? `with ${comparisonResult.reviewCountChangePercent.toFixed(1)}% more reviews`
    : comparisonResult.reviewCountChange < 0
    ? `with ${Math.abs(comparisonResult.reviewCountChangePercent).toFixed(1)}% fewer reviews`
    : 'with the same number of reviews';
    
  doc.text(`• ${performanceText} ${volumeText}.`, 20, textY);
  textY += 7;
  
  if (comparisonResult.improvingThemes.length > 0) {
    const text = `• Customers are particularly happy with: ${comparisonResult.improvingThemes.slice(0, 3).join(', ')}.`;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, textY);
    textY += lines.length * 7;
  }
  
  if (comparisonResult.decliningThemes.length > 0) {
    const text = `• Consider addressing: ${comparisonResult.decliningThemes.slice(0, 3).join(', ')}.`;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, textY);
    textY += lines.length * 7;
  }
  
  if (comparisonResult.newThemes.length > 0) {
    const text = `• New themes in customer feedback: ${comparisonResult.newThemes.slice(0, 3).join(', ')}.`;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, textY);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 280);
  
  // Save the PDF
  doc.save(`${businessName}_Period_Comparison_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export comparison data as CSV
export function exportPeriodComparisonCSV({
  businessName,
  currentPeriod,
  previousPeriod,
  comparisonResult
}: ExportPeriodComparisonOptions) {
  const csvRows = [];
  
  // Headers
  csvRows.push(['Period Comparison Report']);
  csvRows.push([businessName]);
  csvRows.push([]);
  csvRows.push(['Period', 'From', 'To', 'Reviews', 'Avg Rating', 'Sentiment Score']);
  
  // Period data
  const prevAvgRating = previousPeriod.reviews.length > 0 
    ? (previousPeriod.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / previousPeriod.reviews.filter(r => r.stars).length).toFixed(2)
    : 'N/A';
    
  const currAvgRating = currentPeriod.reviews.length > 0 
    ? (currentPeriod.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / currentPeriod.reviews.filter(r => r.stars).length).toFixed(2)
    : 'N/A';
  
  csvRows.push([
    'Previous',
    format(previousPeriod.from, 'yyyy-MM-dd'),
    format(previousPeriod.to, 'yyyy-MM-dd'),
    previousPeriod.reviews.length.toString(),
    prevAvgRating,
    comparisonResult.previousSentimentScore?.toFixed(2) || 'N/A'
  ]);
  
  csvRows.push([
    'Current',
    format(currentPeriod.from, 'yyyy-MM-dd'),
    format(currentPeriod.to, 'yyyy-MM-dd'),
    currentPeriod.reviews.length.toString(),
    currAvgRating,
    comparisonResult.currentSentimentScore?.toFixed(2) || 'N/A'
  ]);
  
  csvRows.push([]);
  csvRows.push(['Changes']);
  csvRows.push(['Metric', 'Value']);
  csvRows.push(['Rating Change', comparisonResult.ratingChange.toFixed(2)]);
  csvRows.push(['Review Count Change', comparisonResult.reviewCountChange.toString()]);
  csvRows.push(['Review Count Change %', comparisonResult.reviewCountChangePercent.toFixed(1) + '%']);
  csvRows.push(['Sentiment Change', comparisonResult.sentimentChange.toFixed(2)]);
  
  // Theme changes
  if (comparisonResult.improvingThemes.length > 0) {
    csvRows.push([]);
    csvRows.push(['Improving Themes']);
    comparisonResult.improvingThemes.forEach(theme => csvRows.push([theme]));
  }
  
  if (comparisonResult.decliningThemes.length > 0) {
    csvRows.push([]);
    csvRows.push(['Declining Themes']);
    comparisonResult.decliningThemes.forEach(theme => csvRows.push([theme]));
  }
  
  // Convert to CSV string
  const csvContent = csvRows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${businessName}_Period_Comparison_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

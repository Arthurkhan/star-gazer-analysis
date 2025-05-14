
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFExportOptions {
  title: string;
  content: string;
  filename: string;
}

// Function to generate a PDF from analysis text
export const generatePDF = ({ title, content, filename }: PDFExportOptions) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 25, 196, 25);
  
  // Format content for PDF
  const sections = content.split(/(?=📊|📈|🗣️|💬|🌍|🎯)/g);
  
  let yPosition = 35;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const textWidth = pageWidth - 2 * margin;
  
  // Add each section
  sections.forEach((section) => {
    // Check if we need a new page based on content length
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Clean up section for PDF rendering (remove HTML tags, etc)
    const cleanedSection = section
      .replace(/<br \/>/g, '\n')
      .replace(/<strong>(.*?)<\/strong>/g, '$1')
      .trim();
    
    // Get first line as header (has emoji)
    const lines = cleanedSection.split('\n');
    const header = lines[0];
    
    // Add header in larger font
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(header, margin, yPosition);
    yPosition += 8;
    
    // Add content in normal font
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    // Process lines after header
    const contentLines = lines.slice(1);
    
    contentLines.forEach((line) => {
      if (line.trim() === '') {
        yPosition += 4; // Add space for empty lines
        return;
      }
      
      // Handle indented lines (bullets, sub-items)
      let textMargin = margin;
      let textLine = line;
      
      if (line.startsWith('-') || line.startsWith('•')) {
        textMargin = margin + 4;
      } else if (line.startsWith('  ') || line.startsWith('\t')) {
        textMargin = margin + 8;
        textLine = line.trim();
      }
      
      // Split long lines to fit page width
      const textLines = doc.splitTextToSize(textLine, textWidth - (textMargin - margin));
      
      textLines.forEach((splitLine) => {
        doc.text(splitLine, textMargin, yPosition);
        yPosition += 6;
      });
    });
    
    yPosition += 10; // Add space between sections
  });
  
  // Add footer with generation date
  const generationDate = new Date().toLocaleString();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${generationDate}`, margin, doc.internal.pageSize.getHeight() - 10);
  
  // Save PDF
  doc.save(filename);
};

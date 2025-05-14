
import { Review } from "@/types/reviews";

// Generate a random date within the last 2 years
const randomDate = () => {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  return new Date(
    twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime())
  ).toISOString();
};

// Generate random reviews for each business
const generateMockReviews = (): Review[] => {
  const businesses = [
    "L'Envol Art Space",
    "The Little Prince Cafe",
    "Vol de Nuit, The Hidden Bar"
  ];
  
  const languages = ["English", "French", "Spanish", "German", "Italian", "Japanese", "Chinese"];
  
  const positiveReviews = [
    "Amazing experience! The staff was friendly and the service was excellent.",
    "I highly recommend this place. The atmosphere is wonderful and everything was perfect.",
    "One of the best places I've been to. Will definitely come back!",
    "Truly exceptional service and quality. A hidden gem in the city.",
    "Outstanding experience from start to finish. The staff went above and beyond.",
    "Wonderful ambiance and excellent service. Highly recommended!",
    "A fantastic experience! The staff was attentive and the quality was top-notch.",
    "Exceeded my expectations in every way. Will be returning soon.",
  ];
  
  const neutralReviews = [
    "It was okay. Nothing special but nothing bad either.",
    "Average experience. The service was good but could be improved.",
    "Decent place. Not amazing but not terrible.",
    "It was fine for what we needed. Might return sometime.",
    "Reasonable experience. Some things were good, others could be better.",
    "Middle of the road experience. Neither exceptional nor disappointing.",
  ];
  
  const negativeReviews = [
    "Disappointing experience. The service was slow and staff was unfriendly.",
    "Would not recommend. Too expensive for what you get.",
    "Not a good experience. Many things need improvement.",
    "Poor service and not worth the price. Will not be returning.",
    "Had higher expectations. Left feeling unsatisfied with the overall experience.",
    "Service was below average and the prices are too high for the quality.",
  ];
  
  const ownerResponses = [
    "Thank you for your feedback! We're delighted you enjoyed your experience with us.",
    "We appreciate your review and are happy to hear you had a positive experience.",
    "Thank you for taking the time to share your thoughts. We hope to see you again soon!",
    "We're sorry to hear about your experience. We would like to make things right.",
    "Thank you for bringing this to our attention. We're continuously working to improve.",
    "",
    "",
    "",
  ];
  
  const mockReviews: Review[] = [];
  
  // Generate 150 reviews total (50 per business)
  for (let i = 0; i < 150; i++) {
    const businessIndex = i % 3;
    const business = businesses[businessIndex];
    
    // Weight ratings to be more realistic (more 4-5 star than 1-2 star)
    let stars: number;
    const ratingRandom = Math.random();
    if (ratingRandom < 0.45) {
      stars = 5;
    } else if (ratingRandom < 0.70) {
      stars = 4;
    } else if (ratingRandom < 0.85) {
      stars = 3;
    } else if (ratingRandom < 0.95) {
      stars = 2;
    } else {
      stars = 1;
    }
    
    // Select review text based on rating
    let text = "";
    if (stars >= 4) {
      text = positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
    } else if (stars === 3) {
      text = neutralReviews[Math.floor(Math.random() * neutralReviews.length)];
    } else {
      text = negativeReviews[Math.floor(Math.random() * negativeReviews.length)];
    }
    
    // Randomly generate language with English being most common
    const language = Math.random() < 0.7 
      ? "English" 
      : languages[Math.floor(Math.random() * languages.length)];
    
    // Generate translated text for non-English reviews
    const textTranslated = language !== "English" ? text : undefined;
    
    // Only some reviews have owner responses
    const hasResponse = Math.random() < 0.7;
    const responseFromOwnerText = hasResponse 
      ? ownerResponses[Math.floor(Math.random() * ownerResponses.length)]
      : "";
    
    // Generate dates, with more recent reviews for higher ratings
    let publishedDate;
    if (stars >= 4) {
      // More recent dates for positive reviews
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      publishedDate = new Date(
        sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
      ).toISOString();
    } else {
      publishedDate = randomDate();
    }
    
    mockReviews.push({
      name: `Reviewer ${i + 1}`,
      title: business,
      stars,
      originalLanguage: language,
      text,
      textTranslated,
      responseFromOwnerText,
      publishedAtDate: publishedDate,
      reviewUrl: `https://maps.google.com/review/r${i}`,
    });
  }
  
  // Sort by date (newest first)
  return mockReviews.sort((a, b) => 
    new Date(b.publishedAtDate).getTime() - new Date(a.publishedAtDate).getTime()
  );
};

// Export the mock data
export const getMockData = (): Review[] => {
  return generateMockReviews();
};

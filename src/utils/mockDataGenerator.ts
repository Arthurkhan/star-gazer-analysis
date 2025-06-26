import type { Review, Business} from '@/types/reviews'
import { TableName } from '@/types/reviews'

/**
 * Generate mock review data when database connection fails
 */
export const generateMockReviews = (): { reviews: Review[], businesses: Business[] } => {
  // Create mock businesses
  const businesses: Business[] = [
    {
      id: 'mock-1',
      name: 'The Little Prince Cafe',
      business_type: 'CAFE',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      name: 'Vol de Nuit, The Hidden Bar',
      business_type: 'BAR',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      name: "L'Envol Art Space",
      business_type: 'GALLERY',
      created_at: new Date().toISOString(),
    },
  ]

  // Sample review texts
  const cafeReviews = [
    'Great coffee and atmosphere! The pastries are amazing too.',
    'The service was a bit slow but the coffee was worth the wait.',
    'Love the ambiance of this cafe. Perfect for working.',
    "Best latte I've had in a long time. Will definitely come back!",
    'The staff was very friendly and accommodating.',
    'Nice quiet spot for breakfast. Love their croissants!',
    'Good place for meetings, but can get crowded on weekends.',
    'Overpriced for what you get, but the quality is undeniable.',
    'Excellent variety of teas and coffees. Great patisserie too!',
  ]

  const barReviews = [
    'Great selection of craft beers and cocktails.',
    'The bartenders are knowledgeable and friendly.',
    'Nice ambiance, but a bit too loud for conversation.',
    'Love the speakeasy vibe of this place!',
    'The cocktails are innovative and delicious.',
    'Overpriced drinks, but the atmosphere makes up for it.',
    'Great spot for a date night! Romantic lighting and great service.',
    'The wine list is impressive. Definitely coming back for more.',
    'Too crowded on weekends, but weekday evenings are perfect.',
  ]

  const galleryReviews = [
    'Fascinating exhibition! The contemporary art pieces were thought-provoking.',
    'The space is beautifully designed, enhances the art experience.',
    'The guided tour was informative and engaging.',
    'Some exhibits were a bit pretentious, but overall worth the visit.',
    'Love the rotating exhibitions, always something new to see.',
    'The lighting and presentation of artwork is excellent.',
    "A hidden gem in the city's art scene.",
    'The staff was knowledgeable about the artists and their work.',
    'Great mix of established and emerging artists.',
  ]

  // Generate reviews for each business
  const reviews: Review[] = []

  // Helper function to generate reviews
  const generateReviewsForBusiness = (
    businessId: string,
    businessName: string,
    reviewTexts: string[],
    count: number,
  ) => {
    const today = new Date()

    for (let i = 0; i < count; i++) {
      // Generate a random date within the last year
      const daysAgo = Math.floor(Math.random() * 365)
      const date = new Date()
      date.setDate(today.getDate() - daysAgo)

      // Get a random review text
      const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)]

      // Random star rating with bias toward 4-5 stars
      const stars = Math.min(5, Math.max(1, Math.floor(Math.random() * 6)))

      // Random sentiment based on stars
      let sentiment = 'neutral'
      if (stars >= 4) sentiment = 'positive'
      else if (stars <= 2) sentiment = 'negative'

      // Create the review
      const review: Review = {
        id: `mock-${businessId}-${i}`,
        business_id: businessId,
        stars,
        name: `Mock Reviewer ${i}`,
        text: reviewText,
        publishedAtDate: date.toISOString(),
        reviewUrl: '#',
        sentiment,
        title: businessName,
        created_at: date.toISOString(),
      }

      reviews.push(review)
    }
  }

  // Generate reviews for each business
  generateReviewsForBusiness('mock-1', 'The Little Prince Cafe', cafeReviews, 23)
  generateReviewsForBusiness('mock-2', 'Vol de Nuit, The Hidden Bar', barReviews, 18)
  generateReviewsForBusiness('mock-3', "L'Envol Art Space", galleryReviews, 15)

  // Sort reviews by date (newest first)
  reviews.sort((a, b) =>
    new Date(b.publishedAtDate).getTime() - new Date(a.publishedAtDate).getTime(),
  )

  return { reviews, businesses }
}

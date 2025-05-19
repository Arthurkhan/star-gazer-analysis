/**
 * This migration will populate the new database schema with existing data from the old schema.
 * Run this after creating the new tables structure:
 * 
 * CREATE TABLE businesses (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name text NOT NULL,
 *   business_type text NOT NULL,
 *   created_at timestamp with time zone DEFAULT now()
 * );
 * 
 * CREATE TABLE reviews (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   business_id uuid REFERENCES businesses(id),
 *   stars integer,
 *   name text,
 *   text text,
 *   texttranslated text,
 *   publishedatdate timestamp with time zone,
 *   reviewurl text,
 *   responsefromownertext text,
 *   sentiment text,
 *   staffmentioned text,
 *   mainthemes text,
 *   created_at timestamp with time zone DEFAULT now()
 * );
 * 
 * CREATE TABLE recommendations (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   business_id uuid REFERENCES businesses(id),
 *   recommendations jsonb,
 *   created_at timestamp with time zone DEFAULT now()
 * );
 */

import { supabase } from '@/integrations/supabase/client';
import { BusinessType } from '@/types/businessTypes';
import { getBusinessTypeFromName } from '@/types/BusinessMappings';
import { TableName } from '@/types/reviews';

/**
 * Migrates all data from the old schema to the new schema.
 * Only run this once as it will duplicate data if run multiple times.
 */
export async function migrateDataToNewSchema() {
  try {
    // Step 1: Create business entries for each table
    const tableNames: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    const createdBusinesses = [];
    
    // Create business entries one by one
    for (const tableName of tableNames) {
      const businessType = getBusinessTypeFromName(tableName);
      
      // Create the business entry
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: tableName,
          business_type: businessType
        })
        .select('id')
        .single();
      
      if (businessError) {
        console.error(`Error creating business for ${tableName}:`, businessError);
        continue;
      }
      
      console.log(`Created business for ${tableName} with ID: ${business.id}`);
      createdBusinesses.push({ id: business.id, name: tableName });
      
      // Step 2: Get all reviews from the old table
      const { data: reviews, error: reviewsError } = await supabase
        .from(tableName)
        .select('*');
      
      if (reviewsError) {
        console.error(`Error fetching reviews for ${tableName}:`, reviewsError);
        continue;
      }
      
      console.log(`Fetched ${reviews.length} reviews for ${tableName}`);
      
      // Step 3: Insert reviews into the new reviews table with business_id
      if (reviews.length === 0) {
        console.log(`No reviews to migrate for ${tableName}`);
        continue;
      }
      
      // Format the reviews for the new schema
      const formattedReviews = reviews.map(review => ({
        business_id: business.id,
        stars: review.stars,
        name: review.name,
        text: review.text,
        texttranslated: review.textTranslated,
        publishedatdate: review.publishedAtDate,
        reviewurl: review.reviewUrl,
        responsefromownertext: review.responseFromOwnerText,
        sentiment: review.sentiment,
        staffmentioned: review.staffMentioned,
        mainthemes: review.mainThemes
      }));
      
      // Insert reviews in batches of 100 to avoid timeouts
      const batchSize = 100;
      for (let i = 0; i < formattedReviews.length; i += batchSize) {
        const batch = formattedReviews.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('reviews')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting reviews batch for ${tableName}:`, insertError);
        } else {
          console.log(`Inserted ${batch.length} reviews for ${tableName} (batch ${i/batchSize + 1})`);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    return { success: true, businesses: createdBusinesses };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}

/**
 * Checks if migration is needed by checking if the businesses table is empty
 */
export async function checkIfMigrationNeeded() {
  try {
    // Check if there are any businesses
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    // Return true if no businesses exist (migration needed)
    return !businesses || businesses.length === 0;
  } catch (error) {
    console.error('Error checking if migration is needed:', error);
    return false; // Assume migration not needed on error
  }
}

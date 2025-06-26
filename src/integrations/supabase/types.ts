export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          business_type: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_type: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_type?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          business_id: string
          created_at: string
          id: string
          recommendations: Json
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          recommendations: Json
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          recommendations?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'recommendations_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      reviews: {
        Row: {
          business_id: string
          created_at: string
          id: string
          mainThemes: string | null
          name: string
          publishedatdate: string
          responseFromOwnerText: string | null
          reviewUrl: string
          sentiment: string | null
          staffMentioned: string | null
          stars: number
          text: string
          textTranslated: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          mainThemes?: string | null
          name: string
          publishedatdate: string
          responseFromOwnerText?: string | null
          reviewUrl: string
          sentiment?: string | null
          staffMentioned?: string | null
          stars: number
          text: string
          textTranslated?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          mainThemes?: string | null
          name?: string
          publishedatdate?: string
          responseFromOwnerText?: string | null
          reviewUrl?: string
          sentiment?: string | null
          staffMentioned?: string | null
          stars?: number
          text?: string
          textTranslated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

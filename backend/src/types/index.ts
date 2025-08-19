export interface CoffeeShop {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  email?: string
  
  // Business details
  rating?: number
  review_count: number
  price_level?: number // 1-4 scale
  
  // Hours - stored as JSON
  hours?: {
    [key: string]: {
      open: string
      close: string
      is_closed: boolean
    }
  }
  
  // Categories/tags
  categories: string[]
  
  // Images
  photos: string[]
  
  // External IDs for API sources
  google_place_id?: string
  
  // Metadata
  created_at: string
  updated_at: string
  last_synced_at?: string
}

export interface SearchFilters {
  query?: string
  latitude?: number
  longitude?: number
  radius?: number // in meters
  min_rating?: number
  max_rating?: number
  price_level?: number[]
  categories?: string[]
  limit?: number
  offset?: number
}

export interface SearchResult {
  coffee_shops: CoffeeShop[]
  total_count: number
  has_more: boolean
}
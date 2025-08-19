import axios from 'axios'
import { CoffeeShop } from '@/types'

// SerpAPI Google Places response types
interface SerpApiGooglePlacesResponse {
  search_metadata: {
    status: string
    id: string
  }
  search_parameters: {
    query: string
    location?: string
    radius?: number
  }
  local_results?: GooglePlaceResult[]
  place_results?: GooglePlaceDetails
  error?: string
}

interface GooglePlaceResult {
  position: number
  place_id: string
  title: string
  address: string
  latitude: number
  longitude: number
  rating?: number
  reviews?: number
  price?: string
  type: string
  types: string[]
  phone?: string
  website?: string
  thumbnail?: string
  hours?: {
    [key: string]: string
  } | string
  service_options?: string[]
}

interface GooglePlaceDetails {
  place_id: string
  title: string
  address: string
  latitude: number
  longitude: number
  rating?: number
  reviews?: number
  price?: string
  phone?: string
  website?: string
  hours?: {
    [key: string]: string
  } | string
  photos?: Array<{
    image: string
    thumbnail: string
  }>
  popular_times?: any[]
}

// Geocoding types
interface GeocodeResponse {
  search_metadata: {
    status: string
    id: string
  }
  place_results?: {
    title: string
    address: string
    gps_coordinates: {
      latitude: number
      longitude: number
    }
    place_id: string
  }
  local_results?: Array<{
    position: number
    place_id: string
    title: string
    address: string
    latitude: number
    longitude: number
  }>
  error?: string
}

export class SerpApiService {
  private apiKey: string
  private baseUrl = 'https://serpapi.com/search'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchGooglePlaces(
    query: string, 
    location?: { lat: number; lng: number }, 
    radius: number = 5000
  ): Promise<Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'>[]> {
    try {
      const params = new URLSearchParams({
        engine: 'google_maps',
        q: `${query} coffee shop`,
        api_key: this.apiKey,
        type: 'search'
      })

      if (location) {
        params.append('ll', `@${location.lat},${location.lng},${Math.floor(radius/1000)}z`)
      }

      const response = await axios.get<SerpApiGooglePlacesResponse>(this.baseUrl, { params })
      
      
      if (response.data.error) {
        throw new Error(`SerpAPI Google Places error: ${response.data.error}`)
      }

      if (!response.data.local_results) {
        return []
      }

      const coffeeShops: Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'>[] = []
      
      for (const place of response.data.local_results) {
        if (this.isCoffeeRelated(place.types || [place.type])) {
          const coffeeShop = this.convertGooglePlaceToCustomFormat(place)
          if (coffeeShop) {
            coffeeShops.push(coffeeShop)
          }
        }
      }

      return coffeeShops
    } catch (error) {
      console.error('SerpAPI Google Places search error:', error)
      throw error
    }
  }

  async geocodeLocation(locationString: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({
        engine: 'google_maps',
        q: locationString,
        api_key: this.apiKey,
        type: 'search'
      })

      const response = await axios.get<GeocodeResponse>(this.baseUrl, { params })
      
      
      if (response.data.error) {
        throw new Error(`SerpAPI Geocoding error: ${response.data.error}`)
      }

      // Try place_results first (single location result)
      if (response.data.place_results) {
        return {
          lat: response.data.place_results.gps_coordinates.latitude,
          lng: response.data.place_results.gps_coordinates.longitude
        }
      }

      // Fall back to local_results (multiple location results)
      if (response.data.local_results && response.data.local_results.length > 0) {
        const firstResult = response.data.local_results[0]
        return {
          lat: firstResult.latitude,
          lng: firstResult.longitude
        }
      }

      return null
    } catch (error) {
      console.error('SerpAPI Geocoding error:', error)
      return null
    }
  }

  async getGooglePlaceDetails(placeId: string): Promise<Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'> | null> {
    try {
      const params = new URLSearchParams({
        engine: 'google_maps',
        place_id: placeId,
        api_key: this.apiKey,
        type: 'place'
      })

      const response = await axios.get<SerpApiGooglePlacesResponse>(this.baseUrl, { params })
      
      if (response.data.error || !response.data.place_results) {
        return null
      }

      return this.convertGooglePlaceDetailsToCustomFormat(response.data.place_results)
    } catch (error) {
      console.error('SerpAPI Google Place details error:', error)
      return null
    }
  }

  private convertGooglePlaceToCustomFormat(place: GooglePlaceResult): Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'> | null {
    try {
      // Parse address components (simplified - SerpAPI provides structured address)
      const addressParts = place.address.split(', ')
      const zipMatch = addressParts[addressParts.length - 1]?.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/)
      
      const state = zipMatch?.[1] || ''
      const zipCode = zipMatch?.[2] || ''
      const city = addressParts[addressParts.length - 2] || ''
      const address = addressParts.slice(0, -2).join(', ')

      // Convert hours format
      const hours = place.hours ? this.convertSerpApiHours(place.hours) : undefined

      // Convert price level
      const priceLevel = place.price ? this.parsePriceLevel(place.price) : undefined

      const coffeeShop: Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'> = {
        name: place.title,
        address,
        city,
        state,
        zip_code: zipCode,
        country: 'US',
        latitude: place.latitude,
        longitude: place.longitude,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
        review_count: place.reviews || 0,
        price_level: priceLevel,
        hours,
        categories: this.extractGoogleCategories(place.types || [place.type]),
        photos: place.thumbnail ? [place.thumbnail] : [],
        google_place_id: place.place_id
      }

      return coffeeShop
    } catch (error) {
      console.error('Error converting Google Place to CoffeeShop:', error)
      return null
    }
  }

  private convertGooglePlaceDetailsToCustomFormat(place: GooglePlaceDetails): Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'> | null {
    try {
      const addressParts = place.address.split(', ')
      const zipMatch = addressParts[addressParts.length - 1]?.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/)
      
      const state = zipMatch?.[1] || ''
      const zipCode = zipMatch?.[2] || ''
      const city = addressParts[addressParts.length - 2] || ''
      const address = addressParts.slice(0, -2).join(', ')

      const hours = place.hours ? this.convertSerpApiHours(place.hours) : undefined
      const priceLevel = place.price ? this.parsePriceLevel(place.price) : undefined
      const photos = place.photos?.map(photo => photo.image) || []

      const coffeeShop: Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'> = {
        name: place.title,
        address,
        city,
        state,
        zip_code: zipCode,
        country: 'US',
        latitude: place.latitude,
        longitude: place.longitude,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
        review_count: place.reviews || 0,
        price_level: priceLevel,
        hours,
        categories: ['Coffee Shop'], // SerpAPI place details may not include detailed categories
        photos,
        google_place_id: place.place_id
      }

      return coffeeShop
    } catch (error) {
      console.error('Error converting Google Place details to CoffeeShop:', error)
      return null
    }
  }


  private isCoffeeRelated(types: string[]): boolean {
    const coffeeTypes = ['cafe', 'coffee_shop', 'coffee shop', 'bakery', 'restaurant', 'food', 'establishment']
    return types.some(type => coffeeTypes.includes(type.toLowerCase()))
  }


  private convertSerpApiHours(hours: { [key: string]: string } | string): { [key: string]: { open: string; close: string; is_closed: boolean } } | undefined {
    
    // If hours is a string (which is what SerpAPI actually returns), parse it differently
    if (typeof hours === 'string') {
      return this.parseHoursString(hours)
    }
    
    // Legacy object handling (in case it changes back)
    const convertedHours: { [key: string]: { open: string; close: string; is_closed: boolean } } = {}
    
    const dayMapping: { [key: string]: string } = {
      'Monday': 'monday',
      'Tuesday': 'tuesday', 
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday'
    }

    for (const [day, timeString] of Object.entries(hours)) {
      const normalizedDay = dayMapping[day] || day.toLowerCase()
      
      if (timeString.toLowerCase().includes('closed')) {
        convertedHours[normalizedDay] = {
          open: '',
          close: '',
          is_closed: true
        }
      } else {
        // Parse time ranges like "9:00 AM - 5:00 PM"
        const timeMatch = timeString.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i)
        if (timeMatch) {
          convertedHours[normalizedDay] = {
            open: timeMatch[1],
            close: timeMatch[2],
            is_closed: false
          }
        } else {
          convertedHours[normalizedDay] = {
            open: '',
            close: '',
            is_closed: true
          }
        }
      }
    }

    return convertedHours
  }

  private parseHoursString(hoursString: string): { [key: string]: { open: string; close: string; is_closed: boolean } } | undefined {
    const convertedHours: { [key: string]: { open: string; close: string; is_closed: boolean } } = {}
    
    // Handle common hours patterns from Google Places
    const lowerHours = hoursString.toLowerCase()
    
    // "Open 24 hours" or "24 hours"
    if (lowerHours.includes('open 24 hours') || lowerHours.includes('24 hours')) {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of allDays) {
        convertedHours[day] = {
          open: '12:00 AM',
          close: '11:59 PM',
          is_closed: false
        }
      }
      return convertedHours
    }
    
    // Currently closed patterns
    if (lowerHours.includes('closed')) {
      // Try to extract opening time if mentioned
      const openMatch = hoursString.match(/opens\s+(\d{1,2}:?\d{0,2})\s*(am|pm)/i)
      if (openMatch) {
        // For now, just indicate it's currently closed but will open
        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for (const day of allDays) {
          convertedHours[day] = {
            open: openMatch[1] + (openMatch[1].includes(':') ? '' : ':00') + ' ' + openMatch[2].toUpperCase(),
            close: '10:00 PM', // Default close time
            is_closed: false
          }
        }
        return convertedHours
      }
      return undefined // No useful hours info
    }
    
    // Currently open patterns with closing time
    const openCloseMatch = hoursString.match(/closes?\s+(\d{1,2}:?\d{0,2})\s*(am|pm)/i)
    if (openCloseMatch && lowerHours.includes('open')) {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of allDays) {
        convertedHours[day] = {
          open: '6:00 AM', // Default open time for coffee shops
          close: openCloseMatch[1] + (openCloseMatch[1].includes(':') ? '' : ':00') + ' ' + openCloseMatch[2].toUpperCase(),
          is_closed: false
        }
      }
      return convertedHours
    }
    
    // If we can't parse it, return undefined to indicate no hours available
    return undefined
  }

  private parsePriceLevel(priceString: string): number | undefined {
    if (!priceString) return undefined
    
    // Handle different price formats
    if (priceString.includes('$')) {
      return priceString.split('$').length - 1 // Count $ symbols
    }
    
    // Handle text descriptions
    const priceMap: { [key: string]: number } = {
      'inexpensive': 1,
      'moderate': 2,
      'expensive': 3,
      'very expensive': 4
    }
    
    return priceMap[priceString.toLowerCase()] || undefined
  }

  private extractGoogleCategories(types: string[]): string[] {
    const categoryMap: { [key: string]: string } = {
      'cafe': 'Coffee Shop',
      'coffee_shop': 'Coffee Shop',
      'bakery': 'Bakery',
      'restaurant': 'Restaurant',
      'food': 'Food & Beverage',
      'establishment': 'Business'
    }

    return types
      .map(type => categoryMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .filter(Boolean)
      .slice(0, 3)
  }
}
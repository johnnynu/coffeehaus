import { supabase } from '@/lib/supabase'
import { CoffeeShop, SearchFilters, SearchResult } from '@/types'

export class CoffeeShopModel {
  static async create(coffeeShop: Omit<CoffeeShop, 'id' | 'created_at' | 'updated_at'>): Promise<CoffeeShop> {
    const { data, error } = await supabase
      .from('coffee_shops')
      .insert(coffeeShop)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async findById(id: string): Promise<CoffeeShop | null> {
    const { data, error } = await supabase
      .from('coffee_shops')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async findByGooglePlaceId(googlePlaceId: string): Promise<CoffeeShop | null> {
    const { data, error } = await supabase
      .from('coffee_shops')
      .select('*')
      .eq('google_place_id', googlePlaceId)
      .single()

    if (error) return null
    return data
  }


  static async search(filters: SearchFilters, discoveryService?: any): Promise<SearchResult> {
    let query = supabase
      .from('coffee_shops')
      .select('*', { count: 'exact' })

    let locationCoords: { lat: number; lng: number } | undefined = undefined;

    // Handle location string by geocoding it first
    if (filters.location_string && discoveryService) {
      locationCoords = await discoveryService.geocodeLocation(filters.location_string);
    } else if (filters.latitude && filters.longitude) {
      locationCoords = { lat: filters.latitude, lng: filters.longitude };
    }

    // Text search
    if (filters.query) {
      const escapedQuery = filters.query.replace(/[%_]/g, '\\$&')
      query = query.or(`name.ilike.%${escapedQuery}%,address.ilike.%${escapedQuery}%,city.ilike.%${escapedQuery}%`)
    }

    // Basic location filtering (non-null coordinates)
    if (locationCoords || (filters.latitude && filters.longitude)) {
      query = query.filter('latitude', 'not.is', null)
      query = query.filter('longitude', 'not.is', null)
    }

    // Rating filter
    if (filters.min_rating !== undefined) {
      query = query.gte('rating', filters.min_rating)
    }
    if (filters.max_rating !== undefined) {
      query = query.lte('rating', filters.max_rating)
    }

    // Price level filter
    if (filters.price_level && filters.price_level.length > 0) {
      query = query.in('price_level', filters.price_level)
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      query = query.overlaps('categories', filters.categories)
    }

    // Get more results if we need to filter by distance
    const baseLimit = filters.limit || 20
    const fetchLimit = locationCoords ? baseLimit * 3 : baseLimit
    const offset = filters.offset || 0
    query = query.range(offset, offset + fetchLimit - 1)

    // Order by rating desc by default
    query = query.order('rating', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    let results = data || []

    // If we have location coordinates, filter by distance and re-sort
    if (locationCoords && results.length > 0) {
      const radius = filters.radius || 50000 // Default 50km radius
      
      results = results
        .map(shop => ({
          ...shop,
          distance: this.calculateDistance(
            locationCoords!.lat, 
            locationCoords!.lng, 
            shop.latitude || 0, 
            shop.longitude || 0
          )
        }))
        .filter(shop => shop.distance <= (radius / 1000)) // Convert to km
        .sort((a, b) => a.distance - b.distance) // Sort by distance
        .slice(0, baseLimit) // Limit to original requested amount
        .map(({ distance, ...shop }) => shop) // Remove distance from response
    }

    return {
      coffee_shops: results,
      total_count: results.length,
      has_more: results.length >= baseLimit
    }
  }

  static async update(id: string, updates: Partial<CoffeeShop>): Promise<CoffeeShop> {
    const { data, error } = await supabase
      .from('coffee_shops')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coffee_shops')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async findSpecificShop(
    shopName: string,
    locationCoords: { lat: number; lng: number },
    radiusMeters: number = 50000
  ): Promise<(CoffeeShop & { distance_m: number })[]> {
    const { data, error } = await supabase
      .rpc('find_specific_shop', {
        shop_name: shopName,
        center_lng: locationCoords.lng,
        center_lat: locationCoords.lat,
        radius_meters: radiusMeters
      })

    if (error) throw error
    return data || []
  }

  // PostGIS geographical queries
  static async countShopsInArea(locationCoords: { lat: number; lng: number }, radiusMeters: number = 50000): Promise<number> {
    const { data, error } = await supabase
      .rpc('count_shops_in_area', {
        center_lng: locationCoords.lng,
        center_lat: locationCoords.lat,
        radius_meters: radiusMeters
      })

    if (error) throw error
    return data || 0
  }

  static async findShopsInArea(
    locationCoords: { lat: number; lng: number }, 
    radiusMeters: number = 50000, 
    limit: number = 50
  ): Promise<(CoffeeShop & { distance_km: number })[]> {
    const { data, error } = await supabase
      .rpc('find_shops_in_area', {
        center_lng: locationCoords.lng,
        center_lat: locationCoords.lat,
        radius_meters: radiusMeters,
        result_limit: limit
      })

    if (error) throw error
    return data || []
  }

  static async getAutocomplete(
    query: string, 
    limit: number = 10, 
    locationCoords?: { lat: number; lng: number },
    discoveryService?: any
  ): Promise<Array<{ id: string; name: string; address: string }>> {
    // Require location coordinates for autocomplete
    if (!locationCoords) {
      return [];
    }
    
    // 1. Get nearby shops (already sorted by distance from PostGIS)
    const nearbyShops = await this.findShopsInArea(locationCoords, 50000, 15); // Get more for filtering
    
    // 2. Apply text filtering
    const escapedQuery = query.toLowerCase();
    const filteredShops = nearbyShops.filter(shop => 
      shop.name.toLowerCase().includes(escapedQuery) ||
      shop.address.toLowerCase().includes(escapedQuery) ||
      shop.city.toLowerCase().includes(escapedQuery)
    );
    
    // 3. Return top 5 results (already sorted by distance from PostGIS)
    return filteredShops.slice(0, 5).map(shop => ({
      id: shop.id,
      name: shop.name,
      address: `${shop.address}, ${shop.city}`
    }))
  }

  // Calculate distance between two points using Haversine formula
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
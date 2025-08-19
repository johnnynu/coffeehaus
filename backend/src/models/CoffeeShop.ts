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


  static async search(filters: SearchFilters): Promise<SearchResult> {
    let query = supabase
      .from('coffee_shops')
      .select('*', { count: 'exact' })

    // Text search
    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,address.ilike.%${filters.query}%,city.ilike.%${filters.query}%`)
    }

    // Location-based search
    if (filters.latitude && filters.longitude && filters.radius) {
      // Use PostGIS for radius search
      query = query.filter('latitude', 'not.is', null)
      query = query.filter('longitude', 'not.is', null)
      // Note: This is a simplified version. In production, you'd use a proper distance query
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

    // Pagination
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Order by rating desc by default
    query = query.order('rating', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      coffee_shops: data || [],
      total_count: count || 0,
      has_more: (count || 0) > offset + limit
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

  static async getAutocomplete(query: string, limit: number = 10): Promise<Array<{ id: string; name: string; address: string }>> {
    const { data, error } = await supabase
      .from('coffee_shops')
      .select('id, name, address, city')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(limit)

    if (error) throw error
    
    return (data || []).map(shop => ({
      id: shop.id,
      name: shop.name,
      address: `${shop.address}, ${shop.city}`
    }))
  }
}
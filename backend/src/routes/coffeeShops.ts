import { Hono } from 'hono'
import { CoffeeShopModel } from '@/models/CoffeeShop'
import { DiscoveryService } from '@/services/discovery'
import { SearchFilters } from '@/types'

const coffeeShops = new Hono()

// Get environment variables
const SERP_API_KEY = process.env.SERP_API_KEY!

const discoveryService = new DiscoveryService(SERP_API_KEY)

// Search coffee shops in database
coffeeShops.get('/', async (c) => {
  try {
    const query = c.req.query('query') || ''
    const lat = c.req.query('lat')
    const lng = c.req.query('lng')
    const radius = c.req.query('radius')
    const minRating = c.req.query('min_rating')
    const maxRating = c.req.query('max_rating')
    const priceLevel = c.req.query('price_level')
    const categories = c.req.query('categories')
    const limit = c.req.query('limit')
    const offset = c.req.query('offset')

    const filters: SearchFilters = {
      query: query || undefined,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
      radius: radius ? parseInt(radius) : undefined,
      min_rating: minRating ? parseFloat(minRating) : undefined,
      max_rating: maxRating ? parseFloat(maxRating) : undefined,
      price_level: priceLevel ? priceLevel.split(',').map(Number) : undefined,
      categories: categories ? categories.split(',') : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    }

    const results = await CoffeeShopModel.search(filters)
    
    return c.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Coffee shops search error:', error)
    return c.json({
      success: false,
      error: 'Failed to search coffee shops'
    }, 500)
  }
})

// Get a specific coffee shop by ID
coffeeShops.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const coffeeShop = await CoffeeShopModel.findById(id)
    
    if (!coffeeShop) {
      return c.json({
        success: false,
        error: 'Coffee shop not found'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: coffeeShop
    })
  } catch (error) {
    console.error('Coffee shop fetch error:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch coffee shop'
    }, 500)
  }
})

// Discover and store new coffee shops from external APIs
coffeeShops.post('/discover', async (c) => {
  try {
    const body = await c.req.json()
    const { query, location, radius = 5000 } = body

    if (!query) {
      return c.json({
        success: false,
        error: 'Query parameter is required'
      }, 400)
    }

    const coords = location ? { lat: location.lat, lng: location.lng } : undefined
    
    const results = await discoveryService.discoverAndStoreCoffeeShops(query, coords, radius)
    
    return c.json({
      success: true,
      data: {
        message: `Discovery completed: ${results.added} added, ${results.updated} updated`,
        ...results
      }
    })
  } catch (error) {
    console.error('Coffee shop discovery error:', error)
    return c.json({
      success: false,
      error: 'Failed to discover coffee shops'
    }, 500)
  }
})

// Discover coffee shops by location string (user-friendly)
coffeeShops.post('/discover-by-location', async (c) => {
  try {
    const body = await c.req.json()
    const { query, location, radius = 5000 } = body

    if (!query) {
      return c.json({
        success: false,
        error: 'Query parameter is required'
      }, 400)
    }

    const results = await discoveryService.discoverAndStoreCoffeeShopsByLocationString(query, location, radius)
    
    return c.json({
      success: true,
      data: {
        message: `Discovery completed: ${results.added} added, ${results.updated} updated`,
        geocoded_location: results.location,
        ...results
      }
    })
  } catch (error) {
    console.error('Coffee shop discovery by location error:', error)
    return c.json({
      success: false,
      error: 'Failed to discover coffee shops'
    }, 500)
  }
})

// Refresh data for a specific coffee shop
coffeeShops.post('/:id/refresh', async (c) => {
  try {
    const id = c.req.param('id')
    const refreshedShop = await discoveryService.refreshShopData(id)
    
    if (!refreshedShop) {
      return c.json({
        success: false,
        error: 'Coffee shop not found or refresh failed'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: refreshedShop
    })
  } catch (error) {
    console.error('Coffee shop refresh error:', error)
    return c.json({
      success: false,
      error: 'Failed to refresh coffee shop data'
    }, 500)
  }
})

// Autocomplete search
coffeeShops.get('/autocomplete/search', async (c) => {
  try {
    const query = c.req.query('query')
    const limit = c.req.query('limit')
    
    if (!query || query.length < 2) {
      return c.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, 400)
    }
    
    const suggestions = await CoffeeShopModel.getAutocomplete(
      query, 
      limit ? parseInt(limit) : 10
    )
    
    return c.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return c.json({
      success: false,
      error: 'Failed to get autocomplete suggestions'
    }, 500)
  }
})

export { coffeeShops }
# Coffeehaus Backend API

TypeScript backend with Hono.js for Coffee Shop Discovery & Listings feature.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# API Keys
SERP_API_KEY=your-serp-api-key-from-serpapi.com

# Server
PORT=3000
NODE_ENV=development
```

4. Set up database schema:
   - Run the SQL commands from `database/schema.sql` in your Supabase SQL editor

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Coffee Shops

#### GET `/api/coffee-shops`
Search for coffee shops in the database.

**Query Parameters:**
- `query` - Search term for name/address
- `lat`, `lng` - Location coordinates
- `radius` - Search radius in meters
- `min_rating`, `max_rating` - Rating range filter
- `price_level` - Comma-separated price levels (1-4)
- `categories` - Comma-separated categories
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "coffee_shops": [...],
    "total_count": 150,
    "has_more": true
  }
}
```

#### GET `/api/coffee-shops/:id`
Get details for a specific coffee shop.

#### POST `/api/coffee-shops/discover`
Discover new coffee shops from Google Places API.

**Request Body:**
```json
{
  "query": "coffee shops",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "radius": 5000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Discovery completed: 15 added, 5 updated",
    "added": 15,
    "updated": 5,
    "errors": []
  }
}
```

#### POST `/api/coffee-shops/:id/refresh`
Refresh data for a specific coffee shop from external APIs.

#### GET `/api/coffee-shops/autocomplete/search`
Get autocomplete suggestions for coffee shop search.

**Query Parameters:**
- `query` - Search term (min 2 characters)
- `limit` - Max suggestions (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "Blue Bottle Coffee",
      "address": "123 Main St, San Francisco, CA"
    }
  ]
}
```

## Architecture

### Services
- **GooglePlacesService**: Integration with Google Places API
- **DiscoveryService**: Orchestrates data from multiple APIs and stores in database

### Models
- **CoffeeShopModel**: Database operations for coffee shops

### Database Schema
See `database/schema.sql` for the complete PostgreSQL schema with PostGIS extensions for location-based queries.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server

## Features Implemented

✅ Hono.js TypeScript backend setup  
✅ Supabase PostgreSQL database integration  
✅ Google Places API
✅ Coffee shop search with filters (rating, distance, price)  
✅ Location-based search with radius  
✅ Autocomplete search functionality  
✅ Data discovery and storage from external APIs  
✅ Automatic data merging and deduplication  

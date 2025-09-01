const API_BASE_URL = "http://localhost:3002/api";

export interface DayHours {
  open: string;
  close: string;
  is_closed: boolean;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  review_count: number;
  price_level?: number;
  latitude?: number;
  longitude?: number;
  hours?: BusinessHours | string;
  categories: string[];
  photos: string[];
  google_place_id?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
}

export interface SearchFilters {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  min_rating?: number;
  max_rating?: number;
  price_level?: number[];
  categories?: string[];
  limit?: number;
  offset?: number;
  location_string?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async searchCoffeeShops(
    filters: SearchFilters = {}
  ): Promise<ApiResponse<CoffeeShop[]>> {
    const params = new URLSearchParams();

    if (filters.query) params.append("query", filters.query);
    if (filters.latitude !== undefined)
      params.append("lat", filters.latitude.toString());
    if (filters.longitude !== undefined)
      params.append("lng", filters.longitude.toString());
    if (filters.radius !== undefined)
      params.append("radius", filters.radius.toString());
    if (filters.min_rating !== undefined)
      params.append("min_rating", filters.min_rating.toString());
    if (filters.max_rating !== undefined)
      params.append("max_rating", filters.max_rating.toString());
    if (filters.price_level)
      params.append("price_level", filters.price_level.join(","));
    if (filters.categories)
      params.append("categories", filters.categories.join(","));
    if (filters.limit !== undefined)
      params.append("limit", filters.limit.toString());
    if (filters.offset !== undefined)
      params.append("offset", filters.offset.toString());
    if (filters.location_string)
      params.append("location_string", filters.location_string);

    const endpoint = `/coffee-shops?${params.toString()}`;
    const response = await this.request<{coffee_shops: CoffeeShop[], total_count: number, has_more: boolean}>(endpoint);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.coffee_shops
      };
    }
    
    return {
      success: false,
      error: response.error || "Search failed"
    };
  }

  async getCoffeeShop(id: string): Promise<ApiResponse<CoffeeShop>> {
    return this.request<CoffeeShop>(`/coffee-shops/${id}`);
  }

  async getAutocompleteSuggestions(
    query: string,
    limit: number = 10,
    location?: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<ApiResponse<Array<{id: string, name: string, address: string}>>> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    // Prioritize GPS coordinates over location string
    if (coordinates) {
      params.append('lat', coordinates.latitude.toString());
      params.append('lng', coordinates.longitude.toString());
    } else if (location) {
      params.append('location', location);
    }

    return this.request<Array<{id: string, name: string, address: string}>>(
      `/coffee-shops/autocomplete/search?${params.toString()}`
    );
  }

  async discoverCoffeeShops(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5000
  ): Promise<
    ApiResponse<{ added: number; updated: number; errors: string[] }>
  > {
    return this.request<{ added: number; updated: number; errors: string[] }>(`/coffee-shops/discover`, {
      method: "POST",
      body: JSON.stringify({ query, location, radius }),
    });
  }

  async discoverCoffeeShopsByLocation(
    query: string,
    locationString?: string,
    radius: number = 5000
  ): Promise<
    ApiResponse<{
      added: number;
      updated: number;
      errors: string[];
      location?: { lat: number; lng: number };
    }>
  > {
    return this.request<{
      added: number;
      updated: number;
      errors: string[];
      location?: { lat: number; lng: number };
    }>(`/coffee-shops/discover-by-location`, {
      method: "POST",
      body: JSON.stringify({ query, location: locationString, radius }),
    });
  }

  async refreshCoffeeShop(id: string): Promise<ApiResponse<CoffeeShop>> {
    return this.request<CoffeeShop>(`/coffee-shops/${id}/refresh`, {
      method: "POST",
    });
  }

  // User location preferences
  async getUserLocationPreference(userId: string): Promise<ApiResponse<{
    default_location?: string | null;
    default_latitude?: number | null;
    default_longitude?: number | null;
    recent_locations?: Array<{
      location: string;
      latitude?: number | null;
      longitude?: number | null;
      timestamp: number;
    }>;
  }>> {
    return this.request(`/users/${userId}/location`);
  }

  async updateUserLocationPreference(
    userId: string,
    location: string,
    latitude?: number,
    longitude?: number
  ): Promise<ApiResponse<{
    default_location?: string | null;
    default_latitude?: number | null;
    default_longitude?: number | null;
    recent_locations?: Array<{
      location: string;
      latitude?: number | null;
      longitude?: number | null;
      timestamp: number;
    }>;
  }>> {
    return this.request(`/users/${userId}/location`, {
      method: "PUT",
      body: JSON.stringify({ location, latitude, longitude }),
    });
  }
}

// Helper function to get GPS coordinates from localStorage
export const getStoredGPSCoordinates = (): { latitude: number; longitude: number } | null => {
  try {
    const storedLocation = localStorage.getItem('coffeehaus-coords');
    if (storedLocation) {
      const location = JSON.parse(storedLocation);
      if (location.source === 'gps' && location.latitude && location.longitude) {
        return {
          latitude: location.latitude,
          longitude: location.longitude
        };
      }
    }
  } catch (error) {
    console.error('Error reading GPS coordinates from localStorage:', error);
  }
  return null;
};

export const apiClient = new ApiClient();

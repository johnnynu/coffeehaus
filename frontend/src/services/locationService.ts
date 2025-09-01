
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: 'gps' | 'ip' | 'manual';
}

export interface RecentLocation {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: number;
}

export interface LocationInfo extends LocationCoords {
  address: string;
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
}

export interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class LocationService {
  private readonly STORAGE_KEYS = {
    LOCATION: 'coffeehaus-location',
    COORDS: 'coffeehaus-coords',
    PERMISSION_ASKED: 'coffeehaus-location-permission-asked',
    USER_LOCATION_PREF: (userId: string) => `coffeehaus-user-location-${userId}`,
  };

  async checkPermissionState(): Promise<LocationPermissionState> {
    if (!navigator.permissions || !('geolocation' in navigator)) {
      return { granted: false, denied: true, prompt: false };
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt',
      };
    } catch {
      return { granted: false, denied: false, prompt: true };
    }
  }

  async getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let message = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timeout';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // Use a free geocoding service like OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&extratags=1&namedetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address found');
      }

      // Format the address nicely
      const { address } = data;
      const parts = [];
      
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }
      
      if (address.state) {
        parts.push(address.state);
      }
      
      if (address.country && address.country !== 'United States') {
        parts.push(address.country);
      }
      
      return parts.length > 0 ? parts.join(', ') : 'Current Location';
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return 'Current Location';
    }
  }

  async getIPLocation(): Promise<LocationCoords | null> {
    try {
      // Use ipapi.co for IP-based geolocation (city-level accuracy)
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('IP geolocation failed');
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        };
      }
      
      return null;
    } catch (error) {
      console.error('IP geolocation failed:', error);
      return null;
    }
  }

  saveLocationToStorage(location: string, coords?: LocationCoords): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LOCATION, location);
      if (coords) {
        localStorage.setItem(this.STORAGE_KEYS.COORDS, JSON.stringify(coords));
      }
    } catch (error) {
      console.error('Failed to save location to storage:', error);
    }
  }

  async saveUserLocationPreference(userId: string, location: string, coords?: LocationCoords): Promise<void> {
    try {
      // Save to database for logged-in users
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.updateUserLocationPreference(
        userId, 
        location, 
        coords?.latitude, 
        coords?.longitude
      );
      
      if (response.success) {
        // Also save to localStorage as cache for faster loading
        const preference = {
          location,
          coords,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          this.STORAGE_KEYS.USER_LOCATION_PREF(userId),
          JSON.stringify(preference)
        );
      }
      
      // Always save to general storage as fallback
      this.saveLocationToStorage(location, coords);
    } catch (error) {
      console.error('Failed to save user location preference:', error);
      // Fallback to localStorage only
      const preference = {
        location,
        coords,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        this.STORAGE_KEYS.USER_LOCATION_PREF(userId),
        JSON.stringify(preference)
      );
      this.saveLocationToStorage(location, coords);
    }
  }

  getStoredLocation(): { location: string | null; coords: LocationCoords | null } {
    try {
      const location = localStorage.getItem(this.STORAGE_KEYS.LOCATION);
      const coordsStr = localStorage.getItem(this.STORAGE_KEYS.COORDS);
      
      let coords: LocationCoords | null = null;
      if (coordsStr) {
        coords = JSON.parse(coordsStr);
      }
      
      return { location, coords };
    } catch (error) {
      console.error('Failed to get stored location:', error);
      return { location: null, coords: null };
    }
  }

  async getUserLocationPreference(userId: string): Promise<{ location: string | null; coords: LocationCoords | null; recentLocations?: RecentLocation[] }> {
    try {
      // First try to get from database
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.getUserLocationPreference(userId);
      
      if (response.success && response.data) {
        const { default_location, default_latitude, default_longitude, recent_locations } = response.data;
        
        if (default_location) {
          const coords = (default_latitude && default_longitude) ? {
            latitude: default_latitude,
            longitude: default_longitude,
          } : null;
          
          // Cache in localStorage for faster access
          const preference = {
            location: default_location,
            coords,
            timestamp: Date.now(),
          };
          localStorage.setItem(
            this.STORAGE_KEYS.USER_LOCATION_PREF(userId),
            JSON.stringify(preference)
          );
          
          return { 
            location: default_location, 
            coords,
            recentLocations: recent_locations || []
          };
        }
      }
      
      // Fallback to localStorage
      const prefStr = localStorage.getItem(this.STORAGE_KEYS.USER_LOCATION_PREF(userId));
      if (prefStr) {
        const preference = JSON.parse(prefStr);
        return {
          location: preference.location || null,
          coords: preference.coords || null,
        };
      }
      
      // Final fallback to general storage
      return this.getStoredLocation();
    } catch (error) {
      console.error('Failed to get user location preference:', error);
      
      // Fallback to localStorage
      try {
        const prefStr = localStorage.getItem(this.STORAGE_KEYS.USER_LOCATION_PREF(userId));
        if (prefStr) {
          const preference = JSON.parse(prefStr);
          return {
            location: preference.location || null,
            coords: preference.coords || null,
          };
        }
      } catch {
        // Ignore localStorage errors
      }
      
      return this.getStoredLocation();
    }
  }

  hasAskedForPermission(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.PERMISSION_ASKED) === 'true';
    } catch {
      return false;
    }
  }

  markPermissionAsked(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PERMISSION_ASKED, 'true');
    } catch (error) {
      console.error('Failed to mark permission as asked:', error);
    }
  }

  async detectAndSaveLocation(userId?: string): Promise<{ location: string; coords: LocationCoords; source: 'gps' | 'ip'; denied?: boolean } | null> {
    try {
      // Try GPS first
      try {
        const coords = await this.getCurrentLocation();
        const coordsWithSource = { ...coords, source: 'gps' as const };
        const address = await this.reverseGeocode(coords.latitude, coords.longitude);
        
        const result = { location: address, coords: coordsWithSource, source: 'gps' as const };
        
        // Save based on user state
        if (userId) {
          await this.saveUserLocationPreference(userId, address, coordsWithSource);
        } else {
          this.saveLocationToStorage(address, coordsWithSource);
        }
        
        return result;
      } catch (gpsError) {
        console.log('GPS failed, trying IP geolocation:', gpsError);
        
        // Check if permission was denied
        const isDenied = (gpsError as Error).message.includes('denied');
        
        // Fallback to IP geolocation
        const coords = await this.getIPLocation();
        if (coords) {
          const coordsWithSource = { ...coords, source: 'ip' as const };
          const address = await this.reverseGeocode(coords.latitude, coords.longitude);
          
          const result = { 
            location: address, 
            coords: coordsWithSource, 
            source: 'ip' as const,
            denied: isDenied 
          };
          
          if (userId) {
            await this.saveUserLocationPreference(userId, address, coordsWithSource);
          } else {
            this.saveLocationToStorage(address, coordsWithSource);
          }
          
          return result;
        }
        
        // Return denial info even if IP fails
        if (isDenied) {
          return { 
            location: '', 
            coords: { latitude: 0, longitude: 0, source: 'ip' }, 
            source: 'ip',
            denied: true 
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Location detection failed:', error);
      return null;
    }
  }

  getDefaultLocation(): string {
    return 'Los Angeles, CA';
  }

  // Get the best available location for a user
  async getBestLocation(userId?: string): Promise<{ location: string; coords: LocationCoords | null; source: 'user' | 'stored' | 'default'; locationSource?: 'gps' | 'ip' | 'manual'; recentLocations?: RecentLocation[] }> {
    if (userId) {
      const userPref = await this.getUserLocationPreference(userId);
      if (userPref.location) {
        return { 
          location: userPref.location, 
          coords: userPref.coords, 
          source: 'user',
          locationSource: userPref.coords?.source,
          recentLocations: userPref.recentLocations || []
        };
      }
    }
    
    const stored = this.getStoredLocation();
    if (stored.location) {
      return { 
        location: stored.location, 
        coords: stored.coords, 
        source: 'stored',
        locationSource: stored.coords?.source
      };
    }
    
    return { 
      location: this.getDefaultLocation(), 
      coords: null, 
      source: 'default',
      locationSource: 'manual'
    };
  }

  // Get recent locations for a user
  async getRecentLocations(userId: string): Promise<RecentLocation[]> {
    try {
      const userPref = await this.getUserLocationPreference(userId);
      return userPref.recentLocations || [];
    } catch (error) {
      console.error('Failed to get recent locations:', error);
      return [];
    }
  }
}

export const locationService = new LocationService();
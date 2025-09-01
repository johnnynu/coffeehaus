import { supabase } from "@/lib/supabase";

export interface RecentLocation {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: number;
}

export interface UserLocationPreference {
  default_location?: string | null;
  default_latitude?: number | null;
  default_longitude?: number | null;
  recent_locations?: RecentLocation[];
}

export interface User {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  default_location?: string | null;
  default_latitude?: number | null;
  default_longitude?: number | null;
  recent_locations?: RecentLocation[];
  created_at?: string;
  updated_at?: string;
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  static async updateLocationPreference(
    userId: string,
    location: string,
    latitude?: number,
    longitude?: number
  ): Promise<User | null> {
    // First get current user to update recent locations
    const currentUser = await this.findById(userId);
    if (!currentUser) return null;

    // Prepare new recent location
    const newRecentLocation: RecentLocation = {
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      timestamp: Date.now(),
    };

    // Update recent locations (max 5, newest first)
    const recentLocations = currentUser.recent_locations || [];

    // Remove if location already exists
    const filteredLocations = recentLocations.filter(
      (loc) => loc.location.toLowerCase() !== location.toLowerCase()
    );

    // Add to front and keep only last 5
    const updatedRecentLocations = [
      newRecentLocation,
      ...filteredLocations,
    ].slice(0, 5);

    const { data, error } = await supabase
      .from("users")
      .update({
        default_location: location,
        default_latitude: latitude || null,
        default_longitude: longitude || null,
        recent_locations: updatedRecentLocations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update user location preference:", error);
      return null;
    }

    return data;
  }

  static async getLocationPreference(
    userId: string
  ): Promise<UserLocationPreference | null> {
    const { data, error } = await supabase
      .from("users")
      .select(
        "default_location, default_latitude, default_longitude, recent_locations"
      )
      .eq("id", userId)
      .single();

    if (error) return null;
    return data;
  }

  static async createOrUpdate(user: Partial<User>): Promise<User | null> {
    if (!user.id) return null;

    const { data, error } = await supabase
      .from("users")
      .upsert({
        ...user,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create/update user:", error);
      return null;
    }

    return data;
  }
}

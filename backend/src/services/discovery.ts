import { SerpApiService } from "./serpApi";
import { CoffeeShopModel } from "@/models/CoffeeShop";
import { CoffeeShop } from "@/types";

export class DiscoveryService {
  private serpApi: SerpApiService;

  constructor(serpApiKey: string) {
    this.serpApi = new SerpApiService(serpApiKey);
  }

  async discoverAndStoreCoffeeShops(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5000
  ): Promise<{ added: number; updated: number; errors: string[] }> {
    const results = { added: 0, updated: 0, errors: [] as string[] };

    try {
      // Search Google Places
      const allResults = await this.serpApi.searchGooglePlaces(
        query,
        location,
        radius
      );

      // Process and store results
      for (const coffeeShop of allResults) {
        try {
          let existingShop: CoffeeShop | null = null;

          // Check if shop already exists by external IDs
          if (coffeeShop.google_place_id) {
            existingShop = await CoffeeShopModel.findByGooglePlaceId(
              coffeeShop.google_place_id
            );
          }

          if (existingShop) {
            // Update existing shop with new data
            const updatedData = this.mergeShopData(existingShop, coffeeShop);
            await CoffeeShopModel.update(existingShop.id, {
              ...updatedData,
              last_synced_at: new Date().toISOString(),
            });
            results.updated++;
          } else {
            // Create new shop
            await CoffeeShopModel.create({
              ...coffeeShop,
              last_synced_at: new Date().toISOString(),
            });
            results.added++;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`Error processing ${coffeeShop.name}:`, error);
          results.errors.push(
            `Error processing ${coffeeShop.name}: ${errorMessage}`
          );
        }
      }

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Discovery service error:", error);
      results.errors.push(`Discovery service error: ${errorMessage}`);
      return results;
    }
  }

  async discoverAndStoreCoffeeShopsByLocationString(
    query: string,
    locationString?: string,
    radius: number = 5000
  ): Promise<{
    added: number;
    updated: number;
    errors: string[];
    location?: { lat: number; lng: number };
  }> {
    const results = {
      added: 0,
      updated: 0,
      errors: [] as string[],
      location: undefined as { lat: number; lng: number } | undefined,
    };

    try {
      let coordinates: { lat: number; lng: number } | undefined = undefined;

      // If location string is provided, geocode it first
      if (locationString) {
        const geocodeResult = await this.serpApi.geocodeLocation(
          locationString
        );
        if (!geocodeResult) {
          results.errors.push(
            `Could not find coordinates for location: ${locationString}`
          );
          return results;
        }
        coordinates = geocodeResult;
        results.location = geocodeResult;
      }

      const discoveryResults = await this.discoverAndStoreCoffeeShops(
        query,
        coordinates,
        radius
      );

      return {
        ...discoveryResults,
        location: results.location,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Discovery by location string error:", error);
      results.errors.push(`Discovery error: ${errorMessage}`);
      return results;
    }
  }

  async refreshShopData(coffeeShopId: string): Promise<CoffeeShop | null> {
    try {
      const existingShop = await CoffeeShopModel.findById(coffeeShopId);
      if (!existingShop) return null;

      let updatedData: Omit<
        CoffeeShop,
        "id" | "created_at" | "updated_at"
      > | null = null;

      if (existingShop.google_place_id) {
        updatedData = await this.serpApi.getGooglePlaceDetails(
          existingShop.google_place_id
        );
      }

      if (updatedData) {
        const mergedData = this.mergeShopData(existingShop, updatedData);
        return await CoffeeShopModel.update(coffeeShopId, {
          ...mergedData,
          last_synced_at: new Date().toISOString(),
        });
      }

      return existingShop;
    } catch (error) {
      console.error("Error refreshing shop data:", error);
      return null;
    }
  }

  private mergeShopData(
    existing: CoffeeShop,
    incoming: Omit<CoffeeShop, "id" | "created_at" | "updated_at">
  ): Partial<CoffeeShop> {
    return {
      // Keep existing data but update with newer information
      name: incoming.name || existing.name,
      address: incoming.address || existing.address,
      city: incoming.city || existing.city,
      state: incoming.state || existing.state,
      zip_code: incoming.zip_code || existing.zip_code,
      phone: incoming.phone || existing.phone,
      website: incoming.website || existing.website,
      email: incoming.email || existing.email,

      rating: incoming.rating ?? existing.rating,
      review_count: Math.max(incoming.review_count, existing.review_count),
      price_level: incoming.price_level ?? existing.price_level,

      latitude: incoming.latitude ?? existing.latitude,
      longitude: incoming.longitude ?? existing.longitude,

      hours: incoming.hours || existing.hours,

      categories: [
        ...new Set([...existing.categories, ...incoming.categories]),
      ],
      photos: [...new Set([...existing.photos, ...incoming.photos])],

      google_place_id: incoming.google_place_id || existing.google_place_id,
    };
  }

  // Geocode locations
  async geocodeLocation(
    locationString: string
  ): Promise<{ lat: number; lng: number } | null> {
    return await this.serpApi.geocodeLocation(locationString);
  }
}

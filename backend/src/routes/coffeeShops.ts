import { Hono } from "hono";
import { CoffeeShopModel } from "@/models/CoffeeShop";
import { DiscoveryService } from "@/services/discovery";
import { SearchFilters } from "@/types";

const coffeeShops = new Hono();
const SERP_API_KEY = process.env.SERP_API_KEY!;

const discoveryService = new DiscoveryService(SERP_API_KEY);

// Search coffee shops
coffeeShops.get("/", async (c) => {
  try {
    const query = c.req.query("query") || "";
    const lat = c.req.query("lat");
    const lng = c.req.query("lng");
    const radius = c.req.query("radius");
    const minRating = c.req.query("min_rating");
    const maxRating = c.req.query("max_rating");
    const priceLevel = c.req.query("price_level");
    const categories = c.req.query("categories");
    const limit = c.req.query("limit");
    const locationString = c.req.query("location_string");

    // Check for location input
    if (query && (locationString || (lat && lng))) {
      try {
        // 1. Get coordinates
        let locationCoords: { lat: number; lng: number } | null = null;

        if (lat && lng) {
          locationCoords = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          };
        } else if (locationString) {
          locationCoords = await discoveryService.geocodeLocation(
            locationString
          );
        }

        if (!locationCoords) {
          return c.json(
            {
              success: false,
              error: `Could not determine location`,
            },
            400
          );
        }

        const radiusMeters = radius ? parseInt(radius) : 50000; // Default 50km

        // 2. Count existing shops in area
        const existingShopsCount = await CoffeeShopModel.countShopsInArea(
          locationCoords,
          radiusMeters
        );

        const minShopsThreshold = 10;

        // 3. If not enough shops, run discovery
        if (existingShopsCount < minShopsThreshold) {
          const discoveryResults =
            await discoveryService.discoverAndStoreCoffeeShopsByLocationString(
              query,
              locationString,
              radiusMeters
            );
        }

        const requestLimit = limit ? parseInt(limit) : 20;
        const shopsInArea = await CoffeeShopModel.findShopsInArea(
          locationCoords,
          radiusMeters,
          requestLimit * 2
        );

        // 5. Apply filters
        let filteredResults = shopsInArea;

        if (query) {
          const searchQuery = query.toLowerCase();
          filteredResults = filteredResults.filter(
            (shop) =>
              shop.name.toLowerCase().includes(searchQuery) ||
              shop.address.toLowerCase().includes(searchQuery) ||
              shop.city.toLowerCase().includes(searchQuery)
          );
        }

        if (minRating) {
          filteredResults = filteredResults.filter(
            (shop) => (shop.rating || 0) >= parseFloat(minRating)
          );
        }

        if (maxRating) {
          filteredResults = filteredResults.filter(
            (shop) => (shop.rating || 0) <= parseFloat(maxRating)
          );
        }

        if (categories) {
          const categoryList = categories.split(",");
          filteredResults = filteredResults.filter((shop) =>
            shop.categories.some((cat) => categoryList.includes(cat))
          );
        }

        if (priceLevel) {
          const priceLevels = priceLevel.split(",").map(Number);
          filteredResults = filteredResults.filter(
            (shop) => shop.price_level && priceLevels.includes(shop.price_level)
          );
        }

        const finalResults = filteredResults
          .slice(0, requestLimit)
          .map((shop) => ({
            ...shop,
            distance_km: shop.distance_km,
          }));

        return c.json({
          success: true,
          data: {
            coffee_shops: finalResults,
            total_count: finalResults.length,
            has_more: filteredResults.length > requestLimit,
          },
        });
      } catch (discoveryError) {
        throw discoveryError;
      }
    }

    return c.json(
      {
        success: false,
        error:
          "Location-based search requires query and either location_string or GPS coordinates (lat/lng)",
      },
      400
    );
  } catch (error) {
    console.error("Coffee shops search error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to search coffee shops",
      },
      500
    );
  }
});

// Get a specific coffee shop by ID
coffeeShops.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const coffeeShop = await CoffeeShopModel.findById(id);

    if (!coffeeShop) {
      return c.json(
        {
          success: false,
          error: "Coffee shop not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: coffeeShop,
    });
  } catch (error) {
    console.error("Coffee shop fetch error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch coffee shop",
      },
      500
    );
  }
});

// Discover and store new coffee shops from external APIs
coffeeShops.post("/discover", async (c) => {
  try {
    const body = await c.req.json();
    const { query, location, radius = 5000 } = body;

    if (!query) {
      return c.json(
        {
          success: false,
          error: "Query parameter is required",
        },
        400
      );
    }

    const coords = location
      ? { lat: location.lat, lng: location.lng }
      : undefined;

    const results = await discoveryService.discoverAndStoreCoffeeShops(
      query,
      coords,
      radius
    );

    return c.json({
      success: true,
      data: {
        message: `Discovery completed: ${results.added} added, ${results.updated} updated`,
        ...results,
      },
    });
  } catch (error) {
    console.error("Coffee shop discovery error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to discover coffee shops",
      },
      500
    );
  }
});

// Discover coffee shops by location string
coffeeShops.post("/discover-by-location", async (c) => {
  try {
    const body = await c.req.json();
    const { query, location, radius = 5000 } = body;

    if (!query) {
      return c.json(
        {
          success: false,
          error: "Query parameter is required",
        },
        400
      );
    }

    const results =
      await discoveryService.discoverAndStoreCoffeeShopsByLocationString(
        query,
        location,
        radius
      );

    return c.json({
      success: true,
      data: {
        message: `Discovery completed: ${results.added} added, ${results.updated} updated`,
        geocoded_location: results.location,
        ...results,
      },
    });
  } catch (error) {
    console.error("Coffee shop discovery by location error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to discover coffee shops",
      },
      500
    );
  }
});

// Refresh data for a specific coffee shop
coffeeShops.post("/:id/refresh", async (c) => {
  try {
    const id = c.req.param("id");
    const refreshedShop = await discoveryService.refreshShopData(id);

    if (!refreshedShop) {
      return c.json(
        {
          success: false,
          error: "Coffee shop not found or refresh failed",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: refreshedShop,
    });
  } catch (error) {
    console.error("Coffee shop refresh error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to refresh coffee shop data",
      },
      500
    );
  }
});

// Autocomplete search
coffeeShops.get("/autocomplete/search", async (c) => {
  try {
    const query = c.req.query("query");
    const limit = c.req.query("limit");
    const location = c.req.query("location");
    const lat = c.req.query("lat");
    const lng = c.req.query("lng");

    if (!query || query.length < 2) {
      return c.json(
        {
          success: false,
          error: "Query must be at least 2 characters",
        },
        400
      );
    }

    // Prioritize GPS coordinates over location string
    let locationCoords: { lat: number; lng: number } | null = null;

    if (lat && lng) {
      // Use direct GPS coordinates
      locationCoords = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    } else if (location) {
      // Fall back to geocoding location string
      locationCoords = await discoveryService.geocodeLocation(location);
    }

    const suggestions = await CoffeeShopModel.getAutocomplete(
      query,
      limit ? parseInt(limit) : 10,
      locationCoords ?? undefined,
      discoveryService
    );

    return c.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get autocomplete suggestions",
      },
      500
    );
  }
});

export { coffeeShops };

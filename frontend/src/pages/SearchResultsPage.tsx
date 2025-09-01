import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SearchResults from "@/components/SearchResults";
import { apiClient, type CoffeeShop, getStoredGPSCoordinates } from "@/lib/api";
import { Button } from "@/components/ui/button";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const [searchResults, setSearchResults] = useState<CoffeeShop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>();

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) return;

      setIsSearching(true);
      setSearchError(undefined);

      try {
        let response;
        
        // Check for GPS coordinates first, then fall back to location string
        const gpsCoords = getStoredGPSCoordinates();
        
        if (gpsCoords) {
          // Use GPS coordinates for precise location-based search
          response = await apiClient.searchCoffeeShops({
            query,
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude
          });
        } else if (location.trim()) {
          // Fall back to location string if no GPS coordinates
          const discoveryResponse = await apiClient.discoverCoffeeShopsByLocation(query, location);
          
          response = await apiClient.searchCoffeeShops({ 
            query, 
            location_string: location 
          });
        } else {
          // No location constraint
          response = await apiClient.searchCoffeeShops({ query });
        }
        
        if (response.success && response.data) {
          setSearchResults(response.data);
        } else {
          setSearchError(response.error || "Failed to search coffee shops");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("An error occurred while searching");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [query, location]);

  if (!query) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              No search query provided
            </h1>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <SearchResults 
          results={searchResults}
          isLoading={isSearching}
          error={searchError}
          query={query}
          location={location}
        />
      </div>
    </div>
  );
};

export default SearchResultsPage;
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const RESULTS_PER_PAGE = 10;

  const performInitialSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(undefined);
    setSearchResults([]);
    setCurrentPage(0);
    setHasMore(true);

    try {
      let response;
      
      // Prioritize location string when provided, then fall back to GPS coordinates
      if (location.trim()) {
        // Use location string when user explicitly provides one
        await apiClient.discoverCoffeeShopsByLocation(query, location);
        
        response = await apiClient.searchCoffeeShops({ 
          query, 
          location_string: location,
          limit: RESULTS_PER_PAGE,
          offset: 0
        });
      } else {
        // Fall back to GPS coordinates if no location string provided
        const gpsCoords = getStoredGPSCoordinates();
        
        if (gpsCoords) {
          // Use GPS coordinates for precise location-based search
          response = await apiClient.searchCoffeeShops({
            query,
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude,
            limit: RESULTS_PER_PAGE,
            offset: 0
          });
        } else {
          // No location constraint
          response = await apiClient.searchCoffeeShops({ 
            query,
            limit: RESULTS_PER_PAGE,
            offset: 0
          });
        }
      }
      
      if (response.success && response.data) {
        setSearchResults(response.data);
        setHasMore(response.data.length === RESULTS_PER_PAGE);
        setCurrentPage(1);
      } else {
        setSearchError(response.error || "Failed to search coffee shops");
        setSearchResults([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("An error occurred while searching");
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreResults = async () => {
    if (!hasMore || isLoadingMore || !query.trim()) {
      console.log('Load more blocked:', { hasMore, isLoadingMore, hasQuery: !!query.trim() });
      return;
    }

    console.log(`Loading more results - page ${currentPage}, offset ${currentPage * RESULTS_PER_PAGE}`);
    setIsLoadingMore(true);

    try {
      let response;
      
      // Prioritize location string when provided, then fall back to GPS coordinates
      if (location.trim()) {
        response = await apiClient.searchCoffeeShops({ 
          query, 
          location_string: location,
          limit: RESULTS_PER_PAGE,
          offset: currentPage * RESULTS_PER_PAGE
        });
      } else {
        // Fall back to GPS coordinates if no location string provided
        const gpsCoords = getStoredGPSCoordinates();
        
        if (gpsCoords) {
          response = await apiClient.searchCoffeeShops({
            query,
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude,
            limit: RESULTS_PER_PAGE,
            offset: currentPage * RESULTS_PER_PAGE
          });
        } else {
          response = await apiClient.searchCoffeeShops({ 
            query,
            limit: RESULTS_PER_PAGE,
            offset: currentPage * RESULTS_PER_PAGE
          });
        }
      }
      
      if (response.success && response.data) {
        // Filter out duplicates based on coffee shop ID
        const existingIds = new Set(searchResults.map(shop => shop.id));
        const newResults = response.data.filter(shop => !existingIds.has(shop.id));
        
        // Only add new results if we have any
        if (newResults.length > 0) {
          setSearchResults(prev => [...prev, ...newResults]);
        }
        
        // Stop loading if we got fewer results than requested or no new unique results
        const shouldContinue = response.data.length === RESULTS_PER_PAGE && newResults.length > 0;
        setHasMore(shouldContinue);
        
        if (shouldContinue) {
          setCurrentPage(prev => prev + 1);
        }
        
        // Add some logging for debugging
        console.log(`Loaded page ${currentPage}: ${response.data.length} total, ${newResults.length} new unique results`);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more error:", error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    performInitialSearch();
    // Store current search location for detail page consistency
    if (location) {
      sessionStorage.setItem('lastSearchLocation', location);
    }
  }, [query, location]);

  if (!query) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
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
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </Link>
          
          {/* Search summary */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Search Results for "{query}"
            </h1>
            {location && (
              <p className="text-muted-foreground">
                in {location}
              </p>
            )}
          </div>
        </div>

        <SearchResults 
          results={searchResults}
          isLoading={isSearching}
          error={searchError}
          query={query}
          location={location}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreResults}
        />
      </div>
    </div>
  );
};

export default SearchResultsPage;
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import type { CoffeeShop, BusinessHours } from "@/lib/api";
import { Card } from "./ui/card";
import StarRating from "./StarRating";
import RateLimitedImage from "./RateLimitedImage";
import { getThumbnailUrl } from "@/lib/imageUtils";
import { MapPin, Phone, Clock, Loader2, Navigation } from "lucide-react";

interface SearchResultsProps {
  results: CoffeeShop[];
  isLoading: boolean;
  error?: string;
  query: string;
  location?: string;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const SearchResults = ({
  results,
  isLoading,
  error,
  query,
  location,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
}: SearchResultsProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore || results.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore) {
          console.log('Intersection triggered, loading more results...');
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Increased to trigger a bit earlier
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, onLoadMore, isLoadingMore, results.length]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <p className="text-muted-foreground">
            Searching for "{query}"{location ? ` in ${location}` : ""}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No coffee shops found for "{query}"{location ? ` in ${location}` : ""}
          . Try a different search term{location ? " or location" : ""}.
        </p>
      </div>
    );
  }

  if (!query) {
    return null;
  }

  // Separate results into direct matches and nearby coffee shops
  const directMatches = results.filter(
    (shop) =>
      shop.name.toLowerCase().includes(query.toLowerCase()) ||
      shop.categories.some((cat) =>
        cat.toLowerCase().includes(query.toLowerCase())
      )
  );

  const nearbyShops = results.filter(
    (shop) =>
      !shop.name.toLowerCase().includes(query.toLowerCase()) &&
      !shop.categories.some((cat) =>
        cat.toLowerCase().includes(query.toLowerCase())
      )
  );

  return (
    <div className="space-y-8">
      {/* Direct matches for the search query */}
      {directMatches.length > 0 && (
        <div className="space-y-4">
          {directMatches.map((shop) => (
            <CoffeeShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}

      {/* Search for query section - only show nearby shops that don't match directly */}
      {nearbyShops.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Search for "{query}"
            </h3>
            <p className="text-muted-foreground">
              All nearby coffee shops{location ? ` in ${location}` : ""} (
              {nearbyShops.length} result{nearbyShops.length !== 1 ? "s" : ""})
            </p>
          </div>

          <div className="space-y-4">
            {nearbyShops.map((shop) => (
              <CoffeeShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      )}

      {/* Infinite scroll loading trigger and spinner */}
      {results.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more coffee shops...</span>
            </div>
          )}
          {!hasMore && !isLoadingMore && results.length > 0 && (
            <div className="text-center text-muted-foreground">
              <p>No more coffee shops to load</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CoffeeShopCardProps {
  shop: CoffeeShop;
}

const CoffeeShopCard = ({ shop }: CoffeeShopCardProps) => {
  const navigate = useNavigate();

  const formatAddress = (shop: CoffeeShop) => {
    const parts = [shop.address, shop.city, shop.state, shop.zip_code].filter(
      Boolean
    );
    return parts.join(", ");
  };

  const formatPrice = (priceLevel?: number) => {
    if (!priceLevel) return "";
    return "$".repeat(priceLevel);
  };

  const getCurrentStatus = (hours: BusinessHours | string | undefined) => {
    if (!hours || typeof hours === "string") return null;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // mon, tue, etc.
    
    const dayMapping: Record<string, keyof BusinessHours> = {
      'sun': 'sunday',
      'mon': 'monday', 
      'tue': 'tuesday',
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday'
    };
    
    const todayKey = dayMapping[currentDay];
    if (!todayKey || !hours[todayKey]) return null;
    
    const todayHours = hours[todayKey];
    if (todayHours?.is_closed) return "Closed";
    
    if (todayHours?.open && todayHours?.close) {
      return `Open until ${todayHours.close}`;
    }
    
    return null;
  };

  const handleCardClick = () => {
    navigate(`/coffee-shop/${shop.id}`);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="bg-card border rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-accent"
      onClick={handleCardClick}
    >
      <div className="flex h-48">
        {/* Left side - Image */}
        <div className="w-48 h-48 flex-shrink-0 overflow-hidden rounded-l-lg">
          {shop.photos && shop.photos.length > 0 ? (
            <img
              src={getThumbnailUrl(shop.photos[0])}
              alt={`${shop.name}`}
              className="w-full h-full object-cover block"
              loading="lazy"
              style={{ margin: 0, padding: 0 }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-muted flex items-center justify-center"><div class="text-muted-foreground text-sm">No Image</div></div>';
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-sm">No Image</div>
            </div>
          )}
        </div>

        {/* Right side - Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Title and Rating Row */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-foreground hover:text-primary transition-colors">
                  {shop.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {shop.rating && (
                    <>
                      <StarRating rating={shop.rating} className="w-4 h-4" />
                      <span className="text-sm text-foreground">
                        {shop.rating}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({shop.review_count} reviews)
                      </span>
                    </>
                  )}
                  {shop.price_level && (
                    <span className="text-sm font-medium text-muted-foreground">
                      • {formatPrice(shop.price_level)}
                    </span>
                  )}
                  {shop.distance_km && (
                    <span className="text-sm font-medium text-muted-foreground">
                      • {(() => {
                        const miles = shop.distance_km * 0.621371;
                        return miles < 0.1 
                          ? `${Math.round(miles * 5280)}ft away`
                          : `${miles.toFixed(1)}mi away`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            {shop.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {shop.categories.slice(0, 3).map((category, index) => (
                  <span key={index} className="text-sm text-muted-foreground">
                    {category}{index < Math.min(shop.categories.length, 3) - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Address */}
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span>{formatAddress(shop)}</span>
            </div>

            {/* Phone */}
            {shop.phone && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span>{shop.phone}</span>
              </div>
            )}

            {/* Hours Status */}
            {getCurrentStatus(shop.hours) && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span className={
                  getCurrentStatus(shop.hours)?.includes('Closed') 
                    ? "text-destructive font-medium" 
                    : "text-primary font-medium"
                }>
                  {getCurrentStatus(shop.hours)}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SearchResults;

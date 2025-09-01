import { useNavigate } from "react-router-dom";
import type { CoffeeShop, BusinessHours } from "@/lib/api";
import { Card } from "./ui/card";
import StarRating from "./StarRating";
import RateLimitedImage from "./RateLimitedImage";
import { getThumbnailUrl } from "@/lib/imageUtils";
import { MapPin, Phone, Globe, Clock } from "lucide-react";

interface SearchResultsProps {
  results: CoffeeShop[];
  isLoading: boolean;
  error?: string;
  query: string;
  location?: string;
}

const SearchResults = ({
  results,
  isLoading,
  error,
  query,
  location,
}: SearchResultsProps) => {
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
          <div>
            <h3 className="text-xl font-bold text-foreground">"{query}"</h3>
            <p className="text-muted-foreground">
              {directMatches.length} result
              {directMatches.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {directMatches.map((shop) => (
              <CoffeeShopCard key={shop.id} shop={shop} />
            ))}
          </div>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyShops.map((shop) => (
              <CoffeeShopCard key={shop.id} shop={shop} />
            ))}
          </div>
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

  const formatHours = (hours: BusinessHours | string | undefined) => {
    if (!hours) return null;
    if (typeof hours === "string") return hours;

    const daysOrder = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    const todayHours = daysOrder
      .filter((day) => hours[day])
      .slice(0, 3)
      .map((day) => {
        const dayInfo = hours[day]!;
        const dayName = day.charAt(0).toUpperCase() + day.slice(1, 4);

        if (dayInfo.is_closed) {
          return `${dayName}: Closed`;
        }

        return `${dayName}: ${dayInfo.open}-${dayInfo.close}`;
      })
      .join(", ");

    return todayHours || "Hours available";
  };

  const handleCardClick = () => {
    navigate(`/coffee-shop/${shop.id}`);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{shop.name}</h3>
          {shop.categories.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {shop.categories.join(", ")}
            </p>
          )}
        </div>

        {shop.rating && (
          <div className="flex items-center space-x-2">
            <StarRating rating={shop.rating} />
            <span className="text-sm text-muted-foreground">
              ({shop.review_count} reviews)
            </span>
            {shop.price_level && (
              <span className="text-sm font-medium text-green-600">
                {formatPrice(shop.price_level)}
              </span>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{formatAddress(shop)}</span>
          </div>

          {shop.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{shop.phone}</span>
            </div>
          )}

          {shop.website && (
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <a
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                onClick={handleLinkClick}
              >
                Visit Website
              </a>
            </div>
          )}

          {shop.hours && (
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{formatHours(shop.hours)}</span>
            </div>
          )}
        </div>

        {shop.photos && shop.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {shop.photos.slice(0, 2).map((photo, index) => (
              <RateLimitedImage
                key={index}
                src={getThumbnailUrl(photo)}
                alt={`${shop.name} photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-md"
                delay={index * 200}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SearchResults;

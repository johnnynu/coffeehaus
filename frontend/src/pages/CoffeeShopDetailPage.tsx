import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Globe, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import RateLimitedImage from "@/components/RateLimitedImage";
import { getLargeImageUrl } from "@/lib/imageUtils";
import { apiClient, type CoffeeShop, type BusinessHours } from "@/lib/api";

const CoffeeShopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [coffeeShop, setCoffeeShop] = useState<CoffeeShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const fetchCoffeeShop = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(undefined);

      try {
        const response = await apiClient.getCoffeeShop(id);
        
        if (response.success && response.data) {
          setCoffeeShop(response.data);
        } else {
          setError(response.error || "Failed to fetch coffee shop details");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError("An error occurred while fetching coffee shop details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoffeeShop();
  }, [id]);

  const formatHours = (hours: BusinessHours | string | undefined) => {
    if (typeof hours === 'string') return hours;
    if (!hours || typeof hours !== 'object') return 'Hours not available';

    const daysOrder: (keyof BusinessHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return daysOrder
      .filter(day => hours[day])
      .map(day => {
        const dayInfo = hours[day];
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        
        if (dayInfo?.is_closed) {
          return `${dayName}: Closed`;
        }
        
        return `${dayName}: ${dayInfo?.open} - ${dayInfo?.close}`;
      })
      .join('\n');
  };

  const formatPrice = (priceLevel?: number) => {
    if (!priceLevel) return '';
    return '$'.repeat(priceLevel);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <p className="text-muted-foreground">Loading coffee shop details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coffeeShop) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error || "Coffee shop not found"}
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">{coffeeShop.name}</h1>
            
            {coffeeShop.categories.length > 0 && (
              <p className="text-lg text-muted-foreground">
                {coffeeShop.categories.join(', ')}
              </p>
            )}

            {coffeeShop.rating && (
              <div className="flex items-center space-x-4">
                <StarRating rating={coffeeShop.rating} className="w-5 h-5" />
                <span className="text-lg font-medium">{coffeeShop.rating}</span>
                <span className="text-muted-foreground">
                  ({coffeeShop.review_count} reviews)
                </span>
                {coffeeShop.price_level && (
                  <span className="text-lg font-medium text-green-600">
                    {formatPrice(coffeeShop.price_level)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Photos Section */}
          {coffeeShop.photos && coffeeShop.photos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coffeeShop.photos.slice(0, 6).map((photo, index) => (
                <RateLimitedImage
                  key={index}
                  src={getLargeImageUrl(photo)}
                  alt={`${coffeeShop.name} photo ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg"
                  delay={index * 300} // Stagger loading by 300ms per image
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact & Location */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Contact & Location</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">{coffeeShop.address}</p>
                    <p className="text-muted-foreground">
                      {[coffeeShop.city, coffeeShop.state, coffeeShop.zip_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>

                {coffeeShop.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`tel:${coffeeShop.phone}`}
                      className="text-primary hover:underline"
                    >
                      {coffeeShop.phone}
                    </a>
                  </div>
                )}

                {coffeeShop.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={coffeeShop.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Hours */}
            {coffeeShop.hours && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Hours</h3>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 mt-1 text-muted-foreground flex-shrink-0" />
                  <pre className="text-sm whitespace-pre-line font-mono">
                    {formatHours(coffeeShop.hours)}
                  </pre>
                </div>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button size="lg">
              Get Directions
            </Button>
            <Button variant="outline" size="lg">
              Call Now
            </Button>
            <Button variant="outline" size="lg">
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoffeeShopDetailPage;
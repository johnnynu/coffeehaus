import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Globe, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import { getLargeImageUrl } from "@/lib/imageUtils";
import { apiClient, type CoffeeShop, type BusinessHours, getStoredGPSCoordinates } from "@/lib/api";

const CoffeeShopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [coffeeShop, setCoffeeShop] = useState<CoffeeShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchCoffeeShop = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(undefined);

      try {
        // Try multiple methods to get the search location
        let searchLocation: string | null = null;
        
        // Method 1: Check referrer URL
        if (document.referrer && document.referrer.includes('/search')) {
          try {
            const referrerUrl = new URL(document.referrer);
            searchLocation = referrerUrl.searchParams.get('location');
            console.log('From referrer:', searchLocation);
          } catch (e) {
            console.log('Failed to parse referrer URL');
          }
        }
        
        // Method 2: Check sessionStorage as fallback
        if (!searchLocation) {
          searchLocation = sessionStorage.getItem('lastSearchLocation');
          console.log('From sessionStorage:', searchLocation);
        }
        
        // Use same priority as search: location string first, then GPS
        const gpsCoords = searchLocation ? undefined : getStoredGPSCoordinates();
        console.log('Using GPS coords:', gpsCoords, 'Location string:', searchLocation);
        const response = await apiClient.getCoffeeShop(id, gpsCoords || undefined, searchLocation || undefined);
        
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

  const handleBackClick = () => {
    // Try to go back to previous page, fallback to home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
  };

  const nextPhoto = () => {
    if (coffeeShop?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev < coffeeShop.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const previousPhoto = () => {
    if (coffeeShop?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : coffeeShop.photos.length - 1
      );
    }
  };

  // Handle keyboard navigation in photo modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPhotoModalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          previousPhoto();
          break;
        case 'ArrowRight':
          nextPhoto();
          break;
        case 'Escape':
          closePhotoModal();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPhotoModalOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
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
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error || "Coffee shop not found"}
            </h1>
            <Button onClick={handleBackClick}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        {/* Hero Section with Image and Basic Info */}
        <div className="relative bg-card">
          {/* Photos Hero Section */}
          {coffeeShop.photos && coffeeShop.photos.length > 0 && (
            <div className="relative h-96 w-full">
              <div 
                className="w-full h-full cursor-pointer"
                onClick={() => openPhotoModal(0)}
              >
                <img
                  src={getLargeImageUrl(coffeeShop.photos[0])}
                  alt={`${coffeeShop.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Hero image failed to load:', coffeeShop.photos[0]);
                    // Try fallback to original URL
                    (e.target as HTMLImageElement).src = coffeeShop.photos[0];
                  }}
                  onLoad={() => console.log('Hero image loaded successfully')}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Back button overlay */}
              <div className="absolute top-4 left-4">
                <Button 
                  variant="secondary" 
                  className="bg-card/90 hover:bg-card text-foreground"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* View Photos button - like Yelp */}
              {coffeeShop.photos.length > 1 && (
                <div className="absolute bottom-4 right-4">
                  <button 
                    onClick={() => openPhotoModal(0)}
                    className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg border"
                  >
                    View all {coffeeShop.photos.length} photos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="px-6 py-6">
            {/* Title and Rating */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">{coffeeShop.name}</h1>
              
              <div className="flex items-center space-x-4 mb-3">
                {coffeeShop.rating && (
                  <>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={coffeeShop.rating} className="w-5 h-5" />
                      <span className="text-lg font-medium text-foreground">{coffeeShop.rating}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ({coffeeShop.review_count} reviews)
                    </span>
                  </>
                )}
                {coffeeShop.price_level && (
                  <span className="text-lg font-medium text-muted-foreground">
                    • {formatPrice(coffeeShop.price_level)}
                  </span>
                )}
              </div>

              {coffeeShop.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {coffeeShop.categories.map((category, index) => (
                    <span
                      key={index}
                      className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-border">
              <Button>
                <MapPin className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
              {coffeeShop.phone && (
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call {coffeeShop.phone}
                </Button>
              )}
              {coffeeShop.website && (
                <Button variant="outline" asChild>
                  <a 
                    href={coffeeShop.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
              <Button variant="outline">
                Share
              </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Location & Contact */}
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Location & Hours</h2>
                  <div className="bg-card rounded-lg border p-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{coffeeShop.address}</p>
                          <p className="text-muted-foreground">
                            {[coffeeShop.city, coffeeShop.state, coffeeShop.zip_code]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>

                      {coffeeShop.hours && (
                        <div className="flex items-start space-x-3 pt-4 border-t border-border">
                          <Clock className="w-5 h-5 mt-1 text-muted-foreground flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Hours of Operation</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {formatHours(coffeeShop.hours).split('\n').map((line, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{line}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Reviews</h2>
                  <div className="bg-card rounded-lg border p-6">
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        <p className="text-lg mb-2">Reviews coming soon!</p>
                        <p className="text-sm">
                          We're working on adding customer reviews and ratings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Photos */}
                {coffeeShop.photos && coffeeShop.photos.length > 1 && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {coffeeShop.photos.slice(1, 7).map((photo, index) => (
                        <div
                          key={index}
                          className="cursor-pointer"
                          onClick={() => openPhotoModal(index + 1)}
                        >
                          <img
                            src={getLargeImageUrl(photo)}
                            alt={`${coffeeShop.name} photo ${index + 2}`}
                            className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              console.error(`Photo ${index + 1} failed to load:`, photo);
                              (e.target as HTMLImageElement).src = photo;
                            }}
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-lg border p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    {coffeeShop.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <a 
                          href={`tel:${coffeeShop.phone}`}
                          className="text-primary hover:underline"
                        >
                          {coffeeShop.phone}
                        </a>
                      </div>
                    )}
                    {coffeeShop.price_level && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Range:</span>
                        <span className="font-medium">{formatPrice(coffeeShop.price_level)}</span>
                      </div>
                    )}
                    {coffeeShop.rating && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <StarRating rating={coffeeShop.rating} className="w-4 h-4" />
                          <span className="font-medium">{coffeeShop.rating}</span>
                        </div>
                      </div>
                    )}
                    {coffeeShop.distance_km && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-medium">
                          {(() => {
                            const miles = coffeeShop.distance_km * 0.621371;
                            return miles < 0.1 
                              ? `${Math.round(miles * 5280)}ft away`
                              : `${miles.toFixed(1)}mi away`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {isPhotoModalOpen && coffeeShop?.photos && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Photo counter */}
            <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
              {currentPhotoIndex + 1} of {coffeeShop.photos.length}
            </div>

            {/* Previous button */}
            {coffeeShop.photos.length > 1 && (
              <button
                onClick={previousPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Next button */}
            {coffeeShop.photos.length > 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Main photo */}
            <div className="relative max-w-full max-h-full">
              <img
                src={getLargeImageUrl(coffeeShop.photos[currentPhotoIndex])}
                alt={`${coffeeShop.name} photo ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.error(`Modal photo ${currentPhotoIndex} failed to load:`, coffeeShop.photos[currentPhotoIndex]);
                  (e.target as HTMLImageElement).src = coffeeShop.photos[currentPhotoIndex];
                }}
              />
            </div>

            {/* Photo thumbnails */}
            {coffeeShop.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
                {coffeeShop.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex 
                        ? 'border-white' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getLargeImageUrl(photo)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = photo;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeeShopDetailPage;
"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Coffee,
  MapPin,
  Crosshair,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "./ui/theme-toggle";
import UserButton from "./auth/UserButton";
import { apiClient, getStoredGPSCoordinates } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import {
  locationService,
  type RecentLocation,
} from "@/services/locationService";

interface SearchBarProps {
  navigate: (path: string) => void;
}

interface Suggestion {
  type: "coffee_shop" | "search_suggestion" | "nearby";
  text: string;
  coffeeShopId?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const SearchBar = ({ navigate }: SearchBarProps) => {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(true);
  const [locationSource, setLocationSource] = useState<
    "gps" | "ip" | "manual" | "default"
  >("default");
  const [locationDenied, setLocationDenied] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const handleUseMyLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationDenied(false);
    locationService.markPermissionAsked();

    try {
      const result = await locationService.detectAndSaveLocation(user?.id);
      if (result) {
        setLocation(result.location || "");
        setLocationSource(result.source);
        setLocationDenied(result.denied || false);

        // Only hide button if we got precise GPS location
        if (result.source === "gps") {
          setShowLocationButton(false);
        }
      }
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setLocationLoading(false);
    }
  }, [user?.id]);

  // Initialize location based on user state
  useEffect(() => {
    const initializeLocation = async () => {
      const bestLocation = await locationService.getBestLocation(user?.id);
      setLocation(bestLocation.location);
      setLocationSource(bestLocation.locationSource || "default");
      setRecentLocations(bestLocation.recentLocations || []);

      // Show "Use My Location" button unless we have precise GPS coordinates
      const hasGPS = bestLocation.coords?.source === "gps";
      setShowLocationButton(!hasGPS);

      // Check if we should auto-detect location for new users
      if (
        bestLocation.source === "default" &&
        !locationService.hasAskedForPermission()
      ) {
        const permissionState = await locationService.checkPermissionState();
        if (permissionState.granted) {
          // Auto-detect if permission already granted
          handleUseMyLocation();
        }
      }
    };

    initializeLocation();
  }, [user, handleUseMyLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowRecentDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        // Prioritize location string when provided, then fall back to GPS coordinates
        const gpsCoords = location.trim() ? undefined : getStoredGPSCoordinates();
        
        const response = await apiClient.getAutocompleteSuggestions(
          query,
          10,
          location,
          gpsCoords || undefined
        );
        const enhancedSuggestions: Suggestion[] = [];

        if (response.success && response.data) {
          const coffeeShopSuggestions: Suggestion[] = response.data.map(
            (item) => ({
              type: "coffee_shop",
              text: `${item.name} - ${item.address}`,
              coffeeShopId: item.id,
              icon: Coffee,
            })
          );
          enhancedSuggestions.push(...coffeeShopSuggestions);
        }

        if (query.trim()) {
          enhancedSuggestions.push({
            type: "search_suggestion",
            text: `Search for "${query}"`,
            icon: Search,
          });
        }

        enhancedSuggestions.push({
          type: "nearby",
          text: "All nearby coffee shops",
          icon: MapPin,
        });

        setSuggestions(enhancedSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, location]);

  const saveLocationForUser = async (locationString: string) => {
    if (user && locationString.trim()) {
      await locationService.saveUserLocationPreference(user.id, locationString);
      // Refresh recent locations after saving
      const updated = await locationService.getRecentLocations(user.id);
      setRecentLocations(updated);
    } else if (locationString.trim()) {
      locationService.saveLocationToStorage(locationString);
    }
  };

  const handleRecentLocationSelect = (recentLocation: RecentLocation) => {
    setLocation(recentLocation.location);
    setShowRecentDropdown(false);
    if (locationRef.current) {
      locationRef.current.blur(); // Remove focus to hide dropdown
    }
  };

  const handleQueryInputFocus = () => {
    setShowRecentDropdown(false);
  };

  const handleLocationInputFocus = () => {
    if (user && recentLocations.length > 0) {
      setShowRecentDropdown(true);
    }
  };

  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocation(e.target.value);
    // Show dropdown when field is cleared, hide when typing
    if (user && recentLocations.length > 0) {
      if (e.target.value.trim() === "") {
        setShowRecentDropdown(true);
      } else {
        setShowRecentDropdown(false);
      }
    }
  };

  const handleSearch = (suggestion: Suggestion) => {
    // Save location for future use
    saveLocationForUser(location);

    if (suggestion.type === "coffee_shop" && suggestion.coffeeShopId) {
      // Navigate directly to coffee shop page
      navigate(`/coffee-shop/${suggestion.coffeeShopId}`);
    } else if (suggestion.type === "nearby") {
      // Search for general coffee shops with location
      const searchUrl = `/search?q=${encodeURIComponent("coffee")}${
        location ? `&location=${encodeURIComponent(location)}` : ""
      }`;
      navigate(searchUrl);
    } else {
      // General search with location
      const searchQuery =
        suggestion.type === "search_suggestion"
          ? query
          : suggestion.text.includes(" - ")
          ? suggestion.text.split(" - ")[0]
          : suggestion.text;

      const searchUrl = `/search?q=${encodeURIComponent(searchQuery)}${
        location ? `&location=${encodeURIComponent(location)}` : ""
      }`;
      navigate(searchUrl);
    }

    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Save location for future use
      saveLocationForUser(location);

      const searchUrl = `/search?q=${encodeURIComponent(query)}${
        location ? `&location=${encodeURIComponent(location)}` : ""
      }`;
      navigate(searchUrl);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="flex bg-white rounded-lg shadow-lg border-2 border-[#E5E7EB] hover:border-[#D4B08C] transition-colors duration-200 overflow-hidden">
        {/* Query Input */}
        <div className="relative flex-1">
          <div className="flex items-center px-4 py-3 border-r border-[#E5E7EB]">
            <Search className="w-5 h-5 text-[#967259] mr-3 flex-shrink-0" />
            <div className="flex flex-col flex-1">
              <label className="text-xs font-medium text-[#4A3726] mb-1">
                Find
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleQueryInputFocus}
                onKeyDown={handleKeyDown}
                placeholder="coffee shops, cafes, roasters..."
                className="text-sm text-[#262626] placeholder-[#6B7280] bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Location Input */}
        <div className="relative flex-1">
          <div className="flex items-center px-4 py-3">
            <MapPin className="w-5 h-5 text-[#967259] mr-3 flex-shrink-0" />
            <div className="flex flex-col flex-1">
              <label className="text-xs font-medium text-[#4A3726] mb-1">
                Near
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={locationRef}
                  value={location}
                  onChange={handleLocationInputChange}
                  onFocus={handleLocationInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="address, neighborhood, city, state"
                  className="text-sm text-[#262626] placeholder-[#6B7280] bg-transparent border-none outline-none w-full"
                />
                {showLocationButton && (
                  <button
                    onClick={handleUseMyLocation}
                    disabled={locationLoading}
                    className="flex items-center justify-center p-1.5 text-[#967259] hover:text-[#4A3726] hover:bg-[#F9F6F4] rounded transition-colors duration-200 flex-shrink-0"
                    title={
                      locationLoading
                        ? "Getting your location..."
                        : locationDenied
                        ? "Location denied. Enable in browser settings and try again."
                        : locationSource === "ip"
                        ? "Using approximate location. Click for precise location."
                        : "Use my precise location"
                    }
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : locationDenied ? (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    ) : locationSource === "ip" ? (
                      <MapPin className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Crosshair className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={() => {
            saveLocationForUser(location);
            const searchUrl = `/search?q=${encodeURIComponent(query)}${
              location ? `&location=${encodeURIComponent(location)}` : ""
            }`;
            navigate(searchUrl);
            setShowSuggestions(false);
          }}
          className="bg-[#4A3726] hover:bg-[#634832] text-white px-6 py-3 transition-colors duration-200 flex items-center justify-center"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg mt-2 shadow-xl z-50 overflow-hidden">
          {suggestions.map((suggestion, index) => {
            const IconComponent = suggestion.icon || Search;
            return (
              <button
                key={index}
                className="w-full text-left px-4 py-3 hover:bg-[#F9F6F4] text-[#262626] flex items-center space-x-3 border-b border-[#E5E7EB] last:border-b-0 transition-colors duration-150"
                onClick={() => handleSearch(suggestion)}
              >
                <IconComponent className="w-4 h-4 text-[#967259] flex-shrink-0" />
                <span className="text-sm">{suggestion.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading && showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg mt-2 shadow-xl z-50 px-4 py-3">
          <span className="text-[#6B7280] text-sm">Searching...</span>
        </div>
      )}

      {showRecentDropdown && user && recentLocations.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg mt-2 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2 bg-[#F9F6F4] border-b border-[#E5E7EB]">
            <span className="text-xs font-medium text-[#4A3726]">
              Recent Locations
            </span>
          </div>
          {recentLocations.map((recentLocation) => (
            <button
              key={`${recentLocation.location}-${recentLocation.timestamp}`}
              className="w-full text-left px-4 py-3 hover:bg-[#F9F6F4] text-[#262626] flex items-center space-x-3 border-b border-[#E5E7EB] last:border-b-0 transition-colors duration-150"
              onClick={() => handleRecentLocationSelect(recentLocation)}
            >
              <MapPin className="w-4 h-4 text-[#967259] flex-shrink-0" />
              <span className="text-sm">{recentLocation.location}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-primary">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Coffee className="w-8 h-8 text-primary-foreground" />
            <h1 className="text-2xl font-bold text-primary-foreground">
              Coffeehaus
            </h1>
          </Link>

          <div className="flex-1 max-w-2xl mx-8">
            <SearchBar navigate={navigate} />
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

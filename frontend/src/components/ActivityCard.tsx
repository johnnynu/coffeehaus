import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import ImageCarousel from "./ImageCarousel";
import BusinessInfo from "./BusinessInfo";
import ActivityActions from "./ActivityActions";

interface User {
  name: string;
  avatar: string;
}

interface Business {
  name: string;
  rating: number;
  reviewCount: number;
  category: string;
}

interface ActivityCardProps {
  id: number;
  type: "photo" | "review";
  user: User;
  timestamp: string;
  action: string;
  business: Business;
  images?: string[];
  image?: string;
  reviewText?: string;
  fullReviewText?: string;
}

export default function ActivityCard({
  type,
  user,
  timestamp,
  action,
  business,
  images,
  image,
  reviewText,
  fullReviewText,
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleReview = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine card height based on content type
  const getCardClasses = () => {
    const baseClasses = "overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-200 bg-card rounded-lg";
    
    // Photo-only posts are more compact
    if (type === "photo" && !reviewText) {
      return `${baseClasses} h-auto`;
    }
    
    // Review-only posts (no images) are taller due to text content
    if (type === "review" && !image && !images) {
      return `${baseClasses} h-auto`;
    }
    
    // Mixed content posts are the tallest
    return `${baseClasses} h-auto`;
  };

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0">
        {/* User Header */}
        <div className={`${type === "photo" && !reviewText ? "p-4 pb-3" : "p-5 pb-4"}`}>
          <div className="flex items-start space-x-3">
            <div className="relative">
              <img
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-border"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <span className="font-semibold text-foreground text-base">
                  {user.name}
                </span>
                <span className="text-muted-foreground text-sm">{action}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{timestamp}</div>
            </div>
          </div>
        </div>

        {/* Image Section */}
        {type === "photo" && images ? (
          <div className="relative">
            <ImageCarousel images={images} alt="Coffee shop" />
          </div>
        ) : (
          image && (
            <div className="relative">
              <img
                src={image}
                alt="Coffee shop"
                className={`w-full object-cover ${
                  type === "review" ? "h-48 sm:h-52" : "h-56 sm:h-64"
                }`}
              />
            </div>
          )
        )}

        {/* Content Section */}
        <div className={`${type === "photo" && !reviewText ? "p-4 pt-3" : "p-5 pt-4"}`}>
          <BusinessInfo
            name={business.name}
            rating={business.rating}
            reviewCount={business.reviewCount}
            category={business.category}
          />

          {/* Review Text for review posts */}
          {type === "review" && reviewText && (
            <div className="mb-5">
              <p className="text-foreground leading-relaxed text-sm font-normal">
                {isExpanded ? fullReviewText : reviewText}
              </p>
              {fullReviewText && fullReviewText !== reviewText && (
                <button
                  onClick={toggleReview}
                  className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}


          <div className={`border-t border-border pt-3 ${
            type === "photo" && !reviewText ? "-mx-4 px-4" : "-mx-5 px-5"
          }`}>
            <ActivityActions />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  className?: string;
}

export default function StarRating({
  rating,
  className = "w-3 h-3",
}: StarRatingProps) {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${className} ${
            i < Math.floor(rating)
              ? "fill-primary text-primary"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

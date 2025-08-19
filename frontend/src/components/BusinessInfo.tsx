import StarRating from "./StarRating";

interface BusinessInfoProps {
  name: string;
  rating: number;
  reviewCount: number;
  category: string;
}

export default function BusinessInfo({
  name,
  rating,
  reviewCount,
  category,
}: BusinessInfoProps) {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-xl text-foreground mb-2 leading-tight hover:underline cursor-pointer">{name}</h3>
      <div className="flex items-center space-x-2 mb-2">
        <StarRating rating={rating} />
        <span className="text-sm font-semibold text-foreground">{rating}</span>
        {reviewCount > 0 && (
          <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
        )}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{category}</div>
    </div>
  );
}

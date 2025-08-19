import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "./ui/button";

export default function ActivityActions() {
  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 flex items-center space-x-2 rounded-md transition-colors"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-sm font-medium">Like</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 flex items-center space-x-2 rounded-md transition-colors"
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="text-sm font-medium">Dislike</span>
      </Button>
    </div>
  );
}

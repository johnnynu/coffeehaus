import { Search, Coffee } from "lucide-react";
import { Input } from "./ui/input";
import { ThemeToggle } from "./ui/theme-toggle";
import UserButton from "./auth/UserButton";

export default function Navbar() {
  return (
    <header className="border-b bg-primary">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coffee className="w-8 h-8 text-primary-foreground" />
            <h1 className="text-2xl font-bold text-primary-foreground">Coffeehaus</h1>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search coffee shops..."
                className="pl-10 bg-input border-border text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}

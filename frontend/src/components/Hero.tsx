import { Button } from "./ui/button";

export default function HeroSection() {
  return (
    <section className="py-16 bg-muted">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-4xl font-bold mb-4 text-foreground">
          Discover Amazing Coffee Experiences
        </h2>
        <p className="text-xl mb-8 text-muted-foreground">
          Like Yelp, but exclusively for coffee lovers. Share your favorite
          spots and discover new ones.
        </p>
        <div className="flex justify-center space-x-4">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Explore Coffee Shops
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground"
          >
            Share Your Experience
          </Button>
        </div>
      </div>
    </section>
  );
}

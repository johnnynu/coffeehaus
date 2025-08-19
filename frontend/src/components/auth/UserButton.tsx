import { UserButton as ClerkUserButton, useUser } from "@clerk/clerk-react";
import { Button } from "../ui/button";

export default function UserButton() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return (
      <div className="flex items-center space-x-4">
        <Button variant="secondary" asChild>
          <a href="/sign-in">Sign In</a>
        </Button>
        <Button variant="default" asChild>
          <a href="/sign-up">Sign Up</a>
        </Button>
      </div>
    );
  }

  return (
    <ClerkUserButton
      appearance={{
        elements: {
          avatarBox: "w-8 h-8",
          userButtonPopoverFooter: "hidden",
        },
      }}
    />
  );
}

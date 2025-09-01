import { ClerkProvider } from "@clerk/clerk-react";
import type { ReactNode } from "react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export default function ClerkProviderWrapper({
  children,
}: ClerkProviderWrapperProps) {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "#4a3726",
          colorBackground: "#fafafa",
          colorInputBackground: "#ffffff",
          colorInputText: "#262626",
          colorText: "#262626",
          colorTextSecondary: "#6b7280",
          borderRadius: "0.625rem",
        },
        elements: {
          card: "shadow-lg border-border",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          socialButtonsBlockButton:
            "border-border text-foreground hover:bg-accent",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

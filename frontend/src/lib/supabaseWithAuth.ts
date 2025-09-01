import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/clerk-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Hook to get authenticated Supabase client using Clerk session
export function useSupabaseClient() {
  const { session } = useSession();

  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      return session?.getToken() ?? null;
    },
    auth: {
      persistSession: false, // We're using Clerk for session management
    },
  });
}

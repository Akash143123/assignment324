import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { user: session?.user ?? null, session, loading };
}

export function displayName(user: User | null): string {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  return (
    (meta?.["full_name"] as string) ||
    (meta?.["name"] as string) ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

export function avatarUrl(user: User | null): string | undefined {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  return (meta?.["avatar_url"] as string) || (meta?.["picture"] as string) || undefined;
}

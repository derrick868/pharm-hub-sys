import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) console.error("[useAuth] ❌ Error getting session:", error);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      console.log("[useAuth] ✅ Initial session:", data.session);
    };

    loadSession();

    // Listen for auth state changes (sign-in/out/refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log("[useAuth] 🔄 Auth state changed:", event);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "TOKEN_REFRESHED") {
        console.log("[useAuth] ♻️ Token refreshed automatically");
      } else if (event === "SIGNED_OUT") {
        console.warn("[useAuth] 🚪 Signed out");
        localStorage.removeItem("supabase.auth.token");
      }
    });

    // Detect auth change across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "supabase.auth.token") {
        console.log("[useAuth] 🔍 Detected auth change in another tab");
        loadSession();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Periodic refresh safety (every 30 mins)
    const refreshInterval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        console.log("[useAuth] ⏰ Periodic refresh check OK");
      } else {
        console.warn("[useAuth] ⚠️ No active session found, reloading...");
        loadSession();
      }
    }, 30 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("supabase.auth.token");
  };

  return { user, session, loading, signOut };
};

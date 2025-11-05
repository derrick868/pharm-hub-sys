import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) console.error("[useAuth] ❌ Error getting session:", error);

      const newSession = data.session;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (newSession?.expires_at) {
        const expDate = new Date(newSession.expires_at * 1000);
        console.log(
          `[useAuth] 🕒 Session expires at: ${expDate.toLocaleString()} (${expDate.toLocaleTimeString()})`
        );
      }
    };

    loadSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log("[useAuth] 🔄 Auth state changed:", event);

      if (session?.expires_at) {
        const expDate = new Date(session.expires_at * 1000);
        console.log(`[useAuth] 🕒 New token expires at: ${expDate.toLocaleString()}`);
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (event === "TOKEN_REFRESHED") {
        const now = Date.now();
        console.log("[useAuth] ♻️ Token refreshed automatically");
        console.log(`[useAuth] ⏰ Time since last refresh: ${(now - lastRefresh) / 1000}s`);
        setLastRefresh(now);
      }

      if (event === "SIGNED_OUT") {
        console.warn("[useAuth] 🚪 Signed out (session cleared)");
        localStorage.removeItem("supabase.auth.token");
      }
    });

    // Detect auth change across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "supabase.auth.token") {
        console.log("[useAuth] 🔍 Auth change detected in another tab");
        loadSession();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // ⚡ Refresh safety loop (every 10 min)
    const refreshInterval = setInterval(async () => {
      const now = Date.now();
      if (now - lastRefresh < 8 * 60 * 1000) return; // don’t spam refreshes
      console.log("[useAuth] 🔁 Checking token age…");
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        console.warn("[useAuth] ⚠️ No active session found, reloading session...");
        loadSession();
      }
    }, 10 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, [lastRefresh]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("supabase.auth.token");
  };

  return { user, session, loading, signOut };
};

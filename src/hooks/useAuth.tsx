import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to persist session manually
  const saveSession = (session: Session | null) => {
    if (session) {
      localStorage.setItem("sb_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("sb_session");
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // 1️⃣ Check localStorage first
        const stored = localStorage.getItem("sb_session");
        if (stored) {
          const savedSession = JSON.parse(stored);
          console.log("[useAuth] 🧩 Restoring saved session from localStorage");
          await supabase.auth.setSession(savedSession);
          setSession(savedSession);
          setUser(savedSession.user ?? null);
        } else {
          // 2️⃣ Get from Supabase if no saved session
          const { data } = await supabase.auth.getSession();
          if (mounted) {
            setSession(data.session);
            setUser(data.session?.user ?? null);
          }
        }
      } catch (err) {
        console.error("[useAuth] ❌ Error loading session", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // 3️⃣ Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[useAuth] 🔄 Auth state changed:", event);
      setSession(session);
      setUser(session?.user ?? null);
      saveSession(session);
    });

    // 4️⃣ Manual background refresh every 25 minutes
    const refreshInterval = setInterval(async () => {
      try {
        console.log("[useAuth] ♻️ Refreshing token manually...");
        const { data, error } = await supabase.auth.refreshSession();
        if (error) console.warn("[useAuth] ⚠️ Refresh failed:", error.message);
        else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          saveSession(data.session);
        }
      } catch (err) {
        console.error("[useAuth] ❌ Refresh error:", err);
      }
    }, 25 * 60 * 1000); // 25 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    saveSession(null);
    setUser(null);
    setSession(null);
  };

  return { user, session, loading, signOut };
};

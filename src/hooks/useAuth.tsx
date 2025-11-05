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
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[useAuth] 🔄 Auth event:", event);
      if (!mounted) return;

      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        setSession(session);
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_OUT" && navigator.onLine) {
        // 👇 Attempt soft refresh if token vanished
        const { data, error } = await supabase.auth.refreshSession();
        if (data.session) {
          console.log("[useAuth] ♻️ Soft refresh recovered session");
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.warn("[useAuth] ⚠️ Refresh failed:", error);
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
};

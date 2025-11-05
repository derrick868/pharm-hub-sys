import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      console.log("[useAuth] ✅ Initial session:", data.session);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    init();

    // ✅ Auth state listener (does NOT auto-navigate)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      console.log("[useAuth] 🔄 Auth state changed:", _event);

      // Avoid redirects for TOKEN_REFRESHED
      if (_event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        navigate("/auth");
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return { user, session, loading, signOut };
};

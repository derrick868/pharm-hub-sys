import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("[useAuth] Session error:", error);
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error("[useAuth] Failed to get session:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        console.log("[useAuth] Event:", event, "Session:", !!currentSession);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
};

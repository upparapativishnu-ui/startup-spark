import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AdminRole = "admin" | "moderator" | null;

export const useIsAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const roles = (data ?? []).map((r: any) => r.role);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("moderator")) setRole("moderator");
      else setRole(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { role, isAdmin: role === "admin", isModerator: role === "moderator" || role === "admin", loading };
};

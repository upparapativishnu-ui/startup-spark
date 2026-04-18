import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Plays a short tone using WebAudio (no asset required)
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.45);
  } catch {
    /* ignore */
  }
};

export const useNewUserAlert = (enabled: boolean, onNew?: () => void) => {
  const mounted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-new-users")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_registrations" },
        (payload: any) => {
          if (!mounted.current) return;
          const row = payload.new;
          playBeep();
          toast.success(`New user: ${row.email}`, {
            description: row.is_suspicious ? "⚠️ Flagged suspicious" : "Just registered",
          });
          onNew?.();
        }
      )
      .subscribe();

    // Avoid alerting on initial mount-time backfill
    setTimeout(() => {
      mounted.current = true;
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      mounted.current = false;
    };
  }, [enabled, onNew]);
};

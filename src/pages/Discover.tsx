import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, MessageSquare, TrendingUp } from "lucide-react";

interface StartupCard {
  id: string;
  user_id: string;
  name: string;
  idea: string;
  description: string;
  funding_required: number;
  founder_name?: string;
}

const formatMoney = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const Discover = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<StartupCard[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: rows } = await supabase
        .from("startups")
        .select("id, user_id, name, idea, description, funding_required")
        .order("created_at", { ascending: false });

      if (rows && rows.length > 0) {
        const ids = Array.from(new Set(rows.map((r) => r.user_id)));
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
        setStartups(rows.map((r) => ({ ...r, founder_name: map.get(r.user_id) })));
      } else {
        setStartups([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (profile && profile.role !== "investor") {
    return <Navigate to="/dashboard" replace />;
  }

  const filtered = startups.filter((s) => {
    const q = query.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.idea.toLowerCase().includes(q);
  });

  return (
    <AppShell>
      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-violet flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Discover startups</h1>
          </div>
          <p className="text-muted-foreground mb-6">A curated stream of founders raising right now.</p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or idea..."
              className="input-glow pl-10 h-11 bg-input/60"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-muted-foreground">
              {startups.length === 0 ? "No startups yet — check back soon." : "No matches for your search."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                className="glass card-lift rounded-2xl p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold truncate">{s.name}</h3>
                    {s.founder_name && (
                      <p className="text-xs text-muted-foreground">by {s.founder_name}</p>
                    )}
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold flex items-center gap-1 shrink-0">
                    <DollarSign className="h-3 w-3" />
                    {formatMoney(s.funding_required)}
                  </div>
                </div>

                <p className="text-sm font-medium text-foreground/90 mb-3 line-clamp-2">{s.idea}</p>
                <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed flex-1">
                  {s.description}
                </p>

                <Button
                  onClick={() => navigate(`/messages?with=${s.user_id}&startup=${s.id}`)}
                  className="w-full bg-gradient-violet text-white border-0 hover:opacity-95"
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Connect with founder
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Discover;

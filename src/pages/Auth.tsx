import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { UserRole } from "@/contexts/AuthContext";

const signupSchema = z.object({
  display_name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [role, setRole] = useState<UserRole>(
    (params.get("role") as UserRole) || "startup"
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ display_name: displayName, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: parsed.data.display_name, role },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome to Swap Agent!");
        navigate("/app", { replace: true });
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
        navigate("/app", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 group">
        <Sparkles className="h-5 w-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
        <span className="font-display font-bold">Swap <span className="text-gold">Agent</span></span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md glass-strong rounded-3xl p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signup" ? "Start in seconds. No card required." : "Sign in to continue your deals."}
          </p>
        </div>

        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["startup", "investor"] as UserRole[]).map((r) => {
              const Icon = r === "startup" ? Rocket : TrendingUp;
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    active
                      ? "border-primary/60 bg-primary/5 shadow-[0_0_0_3px_hsl(45_80%_60%/0.15)]"
                      : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-sm font-semibold capitalize text-left">{r}</div>
                  <div className="text-[11px] text-muted-foreground text-left mt-0.5">
                    {r === "startup" ? "I'm raising" : "I'm investing"}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Label htmlFor="display_name">Display name</Label>
                <Input
                  id="display_name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-glow mt-1.5 h-11 bg-input/60"
                  placeholder="Jane Founder"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glow mt-1.5 h-11 bg-input/60"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glow mt-1.5 h-11 bg-input/60"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-gold text-primary-foreground btn-gold-glow border-0 font-semibold text-base"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to Swap Agent?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary hover:underline font-medium"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;

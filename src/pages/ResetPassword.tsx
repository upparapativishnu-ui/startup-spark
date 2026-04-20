import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    // Supabase places a recovery token in the URL hash and triggers PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If user lands here without a recovery hash and no session, mark invalid after a beat
    const t = setTimeout(async () => {
      if (ready) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) setInvalid(true);
      else setReady(true);
    }, 800);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [ready]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
      toast.success("Password updated");
      setTimeout(() => navigate("/app", { replace: true }), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 group">
        <Sparkles className="h-5 w-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
        <span className="font-display font-bold">
          Swap <span className="text-gold">Agent</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md glass-strong rounded-3xl p-8 md:p-10"
      >
        {done ? (
          <div className="text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Password updated</h1>
            <p className="text-sm text-muted-foreground">Redirecting you to the app…</p>
          </div>
        ) : invalid ? (
          <div className="text-center space-y-3">
            <h1 className="font-display text-2xl font-bold">Reset link invalid or expired</h1>
            <p className="text-sm text-muted-foreground">
              Request a new password reset link.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block mt-2 text-primary hover:underline font-medium text-sm"
            >
              Request new link
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold mb-2">Set a new password</h1>
              <p className="text-sm text-muted-foreground">
                Choose a strong password you haven't used before.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glow mt-1.5 h-11 bg-input/60"
                  placeholder="••••••••"
                  required
                  disabled={!ready}
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-glow mt-1.5 h-11 bg-input/60"
                  placeholder="••••••••"
                  required
                  disabled={!ready}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !ready}
                className="w-full h-12 bg-gradient-gold text-primary-foreground btn-gold-glow border-0 font-semibold text-base"
              >
                {loading ? "Updating..." : ready ? "Update password" : "Verifying link…"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

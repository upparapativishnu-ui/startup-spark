import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Rocket, DollarSign, Lightbulb, FileText } from "lucide-react";

const startupSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(120),
  idea: z.string().trim().min(5, "Idea too short").max(200),
  description: z.string().trim().min(20, "Add a bit more detail").max(2000),
  funding_required: z.coerce.number().min(0, "Cannot be negative").max(1_000_000_000),
});

interface Startup {
  id: string;
  name: string;
  idea: string;
  description: string;
  funding_required: number;
}

const StartupDashboard = () => {
  const { user, profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [description, setDescription] = useState("");
  const [funding, setFunding] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("startups")
      .select("id, name, idea, description, funding_required")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStartup(data);
          setName(data.name);
          setIdea(data.idea);
          setDescription(data.description);
          setFunding(String(data.funding_required));
        }
        setLoading(false);
      });
  }, [user]);

  if (profile && profile.role !== "startup") {
    return <Navigate to="/discover" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = startupSchema.safeParse({ name, idea, description, funding_required: funding });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    try {
      if (startup) {
        const { error } = await supabase
          .from("startups")
          .update(parsed.data)
          .eq("id", startup.id);
        if (error) throw error;
        toast.success("Pitch updated");
      } else {
        const { data, error } = await supabase
          .from("startups")
          .insert({ ...parsed.data, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        setStartup(data as Startup);
        toast.success("Pitch published — investors can now find you");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="container max-w-3xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-violet flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {startup ? "Your pitch" : "Craft your pitch"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {startup ? "Update your details anytime — changes are live instantly." : "Tell investors what you're building. Be sharp, be specific."}
          </p>

          {loading ? (
            <div className="glass rounded-2xl p-12 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-strong rounded-2xl p-8 space-y-6"
            >
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                  <Rocket className="h-4 w-4 text-primary" /> Startup name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Robotics"
                  className="input-glow h-11 bg-input/60"
                  required
                />
              </div>

              <div>
                <Label htmlFor="idea" className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" /> One-line idea
                </Label>
                <Input
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Self-assembling warehouse robots for small businesses"
                  className="input-glow h-11 bg-input/60"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What problem you solve, traction, team, why now..."
                  rows={6}
                  className="input-glow bg-input/60 resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">{description.length}/2000</p>
              </div>

              <div>
                <Label htmlFor="funding" className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Funding required (USD)
                </Label>
                <Input
                  id="funding"
                  type="number"
                  min="0"
                  value={funding}
                  onChange={(e) => setFunding(e.target.value)}
                  placeholder="500000"
                  className="input-glow h-11 bg-input/60"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-gradient-gold text-primary-foreground btn-gold-glow border-0 font-semibold"
              >
                {saving ? "Saving..." : startup ? "Update pitch" : "Publish pitch"}
              </Button>
            </motion.form>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
};

export default StartupDashboard;

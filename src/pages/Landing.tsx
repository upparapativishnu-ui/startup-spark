import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Rocket, TrendingUp, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { Pricing } from "@/components/Pricing";

const features = [
  { icon: Rocket, title: "Pitch in minutes", desc: "Founders craft a tight pitch — name, idea, traction, ask. Clean, structured, and fast." },
  { icon: TrendingUp, title: "Discover the next unicorn", desc: "Investors browse a curated stream of vetted startups, each with the numbers you need." },
  { icon: MessageSquare, title: "Talk in real time", desc: "Direct, encrypted messaging between investors and founders. No middlemen, no noise." },
  { icon: Shield, title: "Built on trust", desc: "Role-based access, row-level security, and a private workspace for every conversation." },
];

const Landing = () => {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container pt-20 pb-32 md:pt-32 md:pb-44 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium tracking-wide uppercase text-muted-foreground mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Capital meets conviction
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-6"
          >
            Where bold startups
            <br />
            meet <span className="text-gold">bold capital</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed"
          >
            Swap Agent is the private deal room where founders pitch, investors discover,
            and the right conversations happen — instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground btn-gold-glow border-0 h-14 px-8 text-base font-semibold">
              <Link to="/auth?mode=signup&role=startup">
                I'm a Founder <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-semibold glass border-primary/30 hover:border-primary/60 hover:bg-primary/5">
              <Link to="/auth?mode=signup&role=investor">
                I'm an Investor
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-32">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass card-lift rounded-2xl p-6"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-violet flex items-center justify-center mb-4 shadow-[var(--shadow-violet)]">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <Pricing />

      {/* CTA */}
      <section className="container pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-aurora opacity-40 -z-10" />
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            The next great company is one conversation away.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join Swap Agent today. No fees. No friction. Just the right people, finding each other.
          </p>
          <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground btn-gold-glow border-0 h-14 px-10 text-base font-semibold">
            <Link to="/auth?mode=signup">Create your account</Link>
          </Button>
        </motion.div>
      </section>
    </AppShell>
  );
};

export default Landing;

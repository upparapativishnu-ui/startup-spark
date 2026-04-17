import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Plan = {
  id: "trial" | "pro" | "premium";
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: typeof Rocket;
  features: string[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: "₹50",
    period: "for 1 week",
    tagline: "Test the waters.",
    icon: Rocket,
    features: [
      "Browse the full startup deal flow",
      "Send up to 5 messages",
      "Basic profile visibility",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "per year",
    tagline: "For serious operators.",
    icon: Sparkles,
    features: [
      "Unlimited messaging",
      "Priority listing in Discover",
      "Advanced startup filters",
      "Read receipts & typing indicators",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹999",
    period: "per year",
    tagline: "The full deal room.",
    icon: Crown,
    highlighted: true,
    features: [
      "Everything in Pro",
      "Featured placement at top of Discover",
      "Direct intros to verified founders",
      "Early access to new launches",
      "White-glove onboarding",
      "Dedicated account manager",
    ],
  },
];

export const Pricing = () => {
  const handleSelect = (plan: Plan) => {
    toast("Payments coming soon", {
      description: `${plan.name} plan reserved. We'll notify you the moment checkout opens.`,
    });
  };

  return (
    <section id="pricing" className="container pb-32 pt-8 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium tracking-wide uppercase text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Pricing
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Choose your <span className="text-gold">edge</span>.
        </h2>
        <p className="max-w-xl mx-auto text-muted-foreground text-lg">
          Three tiers. Zero friction. Cancel any time.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {plans.map((plan, i) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-3xl p-8 card-lift ${
                plan.highlighted
                  ? "glass-strong border-primary/40 md:-translate-y-4 md:scale-[1.03]"
                  : "glass"
              }`}
              style={
                plan.highlighted
                  ? { boxShadow: "0 30px 80px -20px hsl(45 90% 55% / 0.35), var(--shadow-elev)" }
                  : undefined
              }
            >
              {plan.highlighted && (
                <>
                  <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-aurora opacity-50" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-gold text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-[var(--shadow-gold)]">
                      Most Popular
                    </div>
                  </div>
                </>
              )}

              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.highlighted
                    ? "bg-gradient-gold shadow-[var(--shadow-gold)]"
                    : "bg-gradient-violet shadow-[var(--shadow-violet)]"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${
                    plan.highlighted ? "text-primary-foreground" : "text-white"
                  }`}
                />
              </div>

              <h3 className="font-display text-2xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{plan.tagline}</p>

              <div className="flex items-baseline gap-2 mb-8">
                <span
                  className={`font-display text-5xl font-bold tracking-tighter ${
                    plan.highlighted ? "text-gold" : ""
                  }`}
                >
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <Button
                onClick={() => handleSelect(plan)}
                size="lg"
                className={`w-full h-12 font-semibold border-0 ${
                  plan.highlighted
                    ? "bg-gradient-gold text-primary-foreground btn-gold-glow"
                    : "bg-gradient-violet text-white hover:opacity-90 transition-opacity"
                }`}
              >
                Buy Now
              </Button>

              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.highlighted ? "bg-primary/20" : "bg-secondary/20"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${
                          plan.highlighted ? "text-primary" : "text-secondary"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-foreground/85 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center text-xs text-muted-foreground mt-12"
      >
        All prices in INR. Secure checkout • Cancel anytime • Refunds within 7 days.
      </motion.p>
    </section>
  );
};

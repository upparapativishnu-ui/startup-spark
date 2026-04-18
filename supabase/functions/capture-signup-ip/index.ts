import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id required");

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update registration row with real IP
    await supabase
      .from("user_registrations")
      .update({ ip_address: ip, user_agent: ua })
      .eq("user_id", user_id);

    // Recompute suspicious flag based on IP count
    const { count } = await supabase
      .from("user_registrations")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip);

    if ((count ?? 0) >= 3) {
      await supabase
        .from("user_registrations")
        .update({
          is_suspicious: true,
          suspicious_reason: `Multiple registrations from same IP (${count})`,
        })
        .eq("ip_address", ip);
    }

    return new Response(JSON.stringify({ ok: true, ip }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

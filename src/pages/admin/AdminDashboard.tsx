import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Ban, AlertTriangle } from "lucide-react";
import { useNewUserAlert } from "@/hooks/useNewUserAlert";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  total: number;
  today: number;
  blocked: number;
  suspicious: number;
}

interface Reg {
  id: string;
  email: string;
  display_name: string | null;
  registered_at: string;
  is_blocked: boolean;
  is_suspicious: boolean;
  ip_address: string | null;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, blocked: 0, suspicious: 0 });
  const [recent, setRecent] = useState<Reg[]>([]);
  const [alerts, setAlerts] = useState<Reg[]>([]);

  const load = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [{ count: total }, { count: today }, { count: blocked }, { count: suspicious }, { data: recentData }, { data: alertData }] = await Promise.all([
      supabase.from("user_registrations").select("*", { count: "exact", head: true }),
      supabase.from("user_registrations").select("*", { count: "exact", head: true }).gte("registered_at", startOfDay.toISOString()),
      supabase.from("user_registrations").select("*", { count: "exact", head: true }).eq("is_blocked", true),
      supabase.from("user_registrations").select("*", { count: "exact", head: true }).eq("is_suspicious", true),
      supabase.from("user_registrations").select("*").order("registered_at", { ascending: false }).limit(10),
      supabase.from("user_registrations").select("*").eq("is_suspicious", true).eq("is_blocked", false).order("registered_at", { ascending: false }).limit(5),
    ]);

    setStats({ total: total ?? 0, today: today ?? 0, blocked: blocked ?? 0, suspicious: suspicious ?? 0 });
    setRecent((recentData as Reg[]) ?? []);
    setAlerts((alertData as Reg[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  useNewUserAlert(true, load);

  const cards = [
    { label: "Total Users", value: stats.total, icon: Users, color: "text-primary" },
    { label: "New Today", value: stats.today, icon: UserPlus, color: "text-gold" },
    { label: "Blocked", value: stats.blocked, icon: Ban, color: "text-destructive" },
    { label: "Suspicious", value: stats.suspicious, icon: AlertTriangle, color: "text-yellow-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time overview of Swap Agent activity.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label} className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {alerts.length > 0 && (
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" /> Active alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="text-sm flex items-center justify-between p-2 rounded-md bg-background/40">
                  <div>
                    <div className="font-medium">{a.email}</div>
                    <div className="text-xs text-muted-foreground">IP: {a.ip_address ?? "unknown"}</div>
                  </div>
                  <Badge variant="outline" className="border-yellow-500/40 text-yellow-500">
                    Suspicious
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No registrations yet.</p>}
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                <div>
                  <div className="font-medium text-sm">{r.display_name || r.email}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.is_suspicious && <Badge variant="outline" className="border-yellow-500/40 text-yellow-500 text-xs">Suspicious</Badge>}
                  {r.is_blocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.registered_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

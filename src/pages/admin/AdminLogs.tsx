import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

interface Log {
  id: string;
  user_id: string | null;
  actor_id: string | null;
  action: string;
  category: string;
  metadata: any;
  ip_address: string | null;
  created_at: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    (async () => {
      let q = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (category !== "all") q = q.eq("category", category);
      const { data } = await q;
      setLogs((data as Log[]) ?? []);
    })();
  }, [category]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Activity Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">Most recent 200 events.</p>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="admin">Admin actions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No logs.</TableCell></TableRow>
              )}
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-sm">{l.action}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{l.category}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                    {l.metadata?.email || JSON.stringify(l.metadata) || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{l.ip_address ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;

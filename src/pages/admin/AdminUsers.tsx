import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ban, Trash2, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { useNewUserAlert } from "@/hooks/useNewUserAlert";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface Reg {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  ip_address: string | null;
  is_blocked: boolean;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  registered_at: string;
}

type Filter = "all" | "blocked" | "suspicious" | "active";

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Reg[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("user_registrations")
      .select("*")
      .order("registered_at", { ascending: false });
    setUsers((data as Reg[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useNewUserAlert(true, load);

  const logAction = async (action: string, target_user: string, metadata: any = {}) => {
    if (!user) return;
    await supabase.from("activity_logs").insert({
      actor_id: user.id,
      user_id: target_user,
      action,
      category: "admin",
      metadata,
    });
  };

  const toggleBlock = async (u: Reg) => {
    const { error } = await supabase
      .from("user_registrations")
      .update({ is_blocked: !u.is_blocked })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.is_blocked ? "User unblocked" : "User blocked");
    await logAction(u.is_blocked ? "user_unblocked" : "user_blocked", u.user_id, { email: u.email });
    load();
  };

  const remove = async (u: Reg) => {
    const { error } = await supabase.from("user_registrations").delete().eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success("User registration deleted");
    await logAction("user_deleted", u.user_id, { email: u.email });
    load();
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.ip_address ?? "").includes(search);
    const matchesFilter =
      filter === "all" ||
      (filter === "blocked" && u.is_blocked) ||
      (filter === "suspicious" && u.is_suspicious) ||
      (filter === "active" && !u.is_blocked);
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} total registrations.</p>
        </div>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or IP…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users match.</TableCell></TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.display_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{u.ip_address ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.is_blocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
                      {u.is_suspicious && <Badge variant="outline" className="border-yellow-500/40 text-yellow-500 text-xs">Suspicious</Badge>}
                      {!u.is_blocked && !u.is_suspicious && <Badge variant="secondary" className="text-xs">Active</Badge>}
                    </div>
                    {u.suspicious_reason && (
                      <div className="text-[10px] text-muted-foreground mt-1">{u.suspicious_reason}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(u.registered_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleBlock(u)}>
                        {u.is_blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this registration?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes {u.email} from the registration log. The auth account itself remains.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(u)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

export default AdminUsers;

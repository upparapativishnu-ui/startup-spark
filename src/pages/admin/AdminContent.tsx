import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Save, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_KEY = "site_logo_url";

interface Content {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

const AdminContent = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Content[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const load = async () => {
    const { data } = await supabase.from("site_content").select("*").order("key");
    setItems((data as Content[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (item: Content) => {
    const { error } = await supabase
      .from("site_content")
      .update({ value: item.value, updated_by: user?.id })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("site_content").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const create = async () => {
    if (!newKey.trim() || !newValue.trim()) return toast.error("Key and value required");
    const { error } = await supabase
      .from("site_content")
      .insert({ key: newKey.trim(), value: newValue, updated_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Created");
    setNewKey("");
    setNewValue("");
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Site Content</h1>
          <p className="text-muted-foreground text-sm mt-1">Edit text shown across the site. Reflects immediately.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add new content key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input placeholder="key (e.g. hero_title)" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
              <Input className="sm:col-span-2" placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
            </div>
            <Button onClick={create} size="sm"><Plus className="h-4 w-4 mr-1" /> Create</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {items.map((item, i) => (
            <Card key={item.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs text-primary">{item.key}</Label>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={item.value}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, value: e.target.value };
                    setItems(next);
                  }}
                  rows={2}
                />
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                <Button size="sm" onClick={() => save(item)}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No content yet.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;

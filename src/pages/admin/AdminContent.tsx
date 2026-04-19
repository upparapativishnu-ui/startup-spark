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
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("site_content").select("*").order("key");
    const all = (data as Content[]) ?? [];
    const logo = all.find((i) => i.key === LOGO_KEY);
    setLogoUrl(logo?.value ?? "");
    setItems(all.filter((i) => i.key !== LOGO_KEY));
  };

  const upsertLogoUrl = async (url: string) => {
    const { data: existing } = await supabase
      .from("site_content")
      .select("id")
      .eq("key", LOGO_KEY)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("site_content")
        .update({ value: url, updated_by: user?.id })
        .eq("id", existing.id);
    } else {
      await supabase.from("site_content").insert({
        key: LOGO_KEY,
        value: url,
        description: "Brand logo shown in navbar",
        updated_by: user?.id,
      });
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("branding")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
      await upsertLogoUrl(pub.publicUrl);
      setLogoUrl(pub.publicUrl);
      toast.success("Logo updated");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    await upsertLogoUrl("");
    setLogoUrl("");
    toast.success("Logo removed");
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
              <ImageIcon className="h-4 w-4" /> Brand logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Brand logo" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="logo-upload" className="text-xs text-muted-foreground">
                  PNG, JPG, SVG or WebP — under 2MB. Replaces the navbar icon.
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" disabled={uploading}>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
                    </label>
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                      e.target.value = "";
                    }}
                  />
                  {logoUrl && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={removeLogo}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

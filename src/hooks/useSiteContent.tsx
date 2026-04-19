import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ContentMap = Record<string, string>;

let cache: ContentMap | null = null;
const listeners = new Set<(c: ContentMap) => void>();

const fetchAll = async () => {
  const { data } = await supabase.from("site_content").select("key, value");
  const map: ContentMap = {};
  (data ?? []).forEach((r: any) => {
    map[r.key] = r.value;
  });
  cache = map;
  listeners.forEach((l) => l(map));
  return map;
};

export const useSiteContent = () => {
  const [content, setContent] = useState<ContentMap>(cache ?? {});

  useEffect(() => {
    if (!cache) fetchAll();
    const listener = (c: ContentMap) => setContent(c);
    listeners.add(listener);

    const channel = supabase
      .channel(`site_content_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      listeners.delete(listener);
      supabase.removeChannel(channel);
    };
  }, []);

  const get = (key: string, fallback = "") => content[key] ?? fallback;
  return { content, get };
};

export const refreshSiteContent = fetchAll;

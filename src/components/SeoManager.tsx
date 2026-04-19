import { useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

export const SeoManager = () => {
  const { get, content } = useSiteContent();

  useEffect(() => {
    const title = get("seo_title");
    const desc = get("seo_description");
    if (title) document.title = title;
    if (desc) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc);
    }
  }, [content]);

  return null;
};

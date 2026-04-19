import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { useSiteContent } from "@/hooks/useSiteContent";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { get } = useSiteContent();
  const footer = get("footer_text", `© ${new Date().getFullYear()} All rights reserved.`);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          {footer}
        </div>
      </footer>
    </div>
  );
};

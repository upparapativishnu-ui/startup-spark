import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Swap Agent. Built for bold founders & sharp investors.
        </div>
      </footer>
    </div>
  );
};

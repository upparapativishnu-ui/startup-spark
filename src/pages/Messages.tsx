import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Conversation {
  other_id: string;
  other_name: string;
  last_message: string;
  last_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialWith = params.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialWith);
  const [activeName, setActiveName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build conversation list
  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const map = new Map<string, Conversation>();
    for (const m of data ?? []) {
      const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!map.has(other)) {
        map.set(other, {
          other_id: other,
          other_name: "",
          last_message: m.content,
          last_at: m.created_at,
        });
      }
    }

    // bring in initialWith even if no messages yet
    if (initialWith && !map.has(initialWith) && initialWith !== user.id) {
      map.set(initialWith, { other_id: initialWith, other_name: "", last_message: "Start the conversation", last_at: new Date().toISOString() });
    }

    const ids = Array.from(map.keys());
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      for (const p of profs ?? []) {
        const c = map.get(p.id);
        if (c) c.other_name = p.display_name;
      }
    }
    const list = Array.from(map.values()).sort((a, b) => b.last_at.localeCompare(a.last_at));
    setConversations(list);
    if (!activeId && list.length > 0) setActiveId(list[0].other_id);
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load messages with active partner + realtime subscription
  useEffect(() => {
    if (!user || !activeId) return;
    const conv = conversations.find((c) => c.other_id === activeId);
    if (conv) setActiveName(conv.other_name);

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${activeId}),and(sender_id.eq.${activeId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
    };
    load();

    const channel = supabase
      .channel(`msg:${user.id}:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          const isPair =
            (m.sender_id === user.id && m.receiver_id === activeId) ||
            (m.sender_id === activeId && m.receiver_id === user.id);
          if (isPair) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeId, conversations]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !draft.trim()) return;
    const startupId = params.get("startup");
    const content = draft.trim().slice(0, 2000);
    setDraft("");
    const { error, data } = await supabase
      .from("messages")
      .insert([{
        sender_id: user.id,
        receiver_id: activeId,
        startup_id: startupId,
        content,
      }])
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      setDraft(content);
      return;
    }
    if (data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
    }
    // strip query so the conversation persists naturally
    if (params.get("startup") || params.get("with")) {
      params.delete("startup");
      params.delete("with");
      setParams(params, { replace: true });
    }
    loadConversations();
  };

  return (
    <AppShell>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-violet flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Messages</h1>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[70vh]">
          {/* Sidebar */}
          <div className="glass rounded-2xl p-3 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No conversations yet. Connect with a founder from Discover.
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.other_id}
                  onClick={() => setActiveId(c.other_id)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 mb-1 ${
                    activeId === c.other_id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{c.other_name || "User"}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.last_message}</div>
                </button>
              ))
            )}
          </div>

          {/* Chat panel */}
          <div className="glass rounded-2xl flex flex-col overflow-hidden">
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-border/40">
                  <div className="font-display font-semibold">{activeName || "Conversation"}</div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => {
                      const mine = m.sender_id === user?.id;
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              mine
                                ? "bg-gradient-gold text-primary-foreground rounded-br-md shadow-[var(--shadow-gold)]"
                                : "glass-strong rounded-bl-md"
                            }`}
                          >
                            {m.content}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      No messages yet. Say hi 👋
                    </div>
                  )}
                </div>

                <form onSubmit={send} className="p-3 border-t border-border/40 flex gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    className="input-glow bg-input/60 h-11"
                  />
                  <Button
                    type="submit"
                    disabled={!draft.trim()}
                    className="bg-gradient-gold text-primary-foreground btn-gold-glow border-0 h-11 px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Messages;

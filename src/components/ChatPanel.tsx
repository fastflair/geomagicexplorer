import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, MessageSquare, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export interface AgentAction {
  type: "add_layer" | "fly_to" | "highlight_layer" | "record_kg";
  [key: string]: any;
}

export interface AgentContext {
  visibleLayers: { id: string; title: string; url: string; type: string }[];
  mapExtent?: { center: [number, number]; zoom: number };
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  getContext: () => AgentContext;
  onActions: (actions: AgentAction[]) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCallCount?: number;
}

const SUGGESTIONS = [
  "How many earthquakes above magnitude 4 are on the map?",
  "Find flood zone data and add it to my map.",
  "Fly to Los Angeles.",
  "What have I explored so far?",
];

const ChatPanel = ({ open, onClose, getContext, onActions }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: text.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const ctx = getContext();
      const { data, error } = await supabase.functions.invoke("map-agent", {
        body: {
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          visibleLayers: ctx.visibleLayers,
          mapExtent: ctx.mapExtent,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.text || "(No response)",
          toolCallCount: data.toolCallCount,
        },
      ]);
      if (data.actions?.length) {
        onActions(data.actions);
      }
    } catch (err: any) {
      console.error("chat error:", err);
      toast.error("Chat request failed. Please try again.");
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠️ Sorry, I ran into an error handling that request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div
      className={`absolute top-0 right-0 h-full z-40 transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ width: "380px" }}
    >
      <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MessageSquare className="h-4 w-4 text-primary" />
              <Sparkles className="h-2.5 w-2.5 text-geo-purple absolute -top-1 -right-1" />
            </div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">
              Map Agent
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent disabled:opacity-30 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-4">
              <div className="text-sm text-muted-foreground">
                Ask questions about the layers on your map. The agent can query
                real data, add new layers, and remember insights in your
                knowledge graph.
              </div>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 rounded-md bg-sidebar-accent hover:bg-primary/10 hover:text-primary text-sidebar-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`${
                m.role === "user" ? "flex justify-end" : ""
              }`}
            >
              {m.role === "user" ? (
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-lg rounded-tr-sm px-3 py-2 text-sm">
                  {m.content}
                </div>
              ) : (
                <div className="text-sm text-sidebar-foreground">
                  <article className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:mt-2 prose-headings:mb-1 prose-ul:my-1.5 prose-code:text-primary prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </article>
                  {m.toolCallCount ? (
                    <div className="mt-1.5 text-[10px] text-muted-foreground italic">
                      ⚙ Used {m.toolCallCount} tool
                      {m.toolCallCount !== 1 ? "s" : ""}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask the map anything…"
              rows={2}
              className="w-full resize-none bg-sidebar-accent border border-sidebar-border rounded-md px-3 py-2 pr-10 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="absolute right-2 bottom-2 p-1.5 rounded-md text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
              title="Send"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            Powered by Lovable AI · records insights in your knowledge graph
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

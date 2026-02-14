import { useState, useEffect } from "react";
import { Bookmark, Plus, Trash2, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BookmarkItem {
  id: string;
  name: string;
  center_x: number;
  center_y: number;
  zoom: number;
}

interface BookmarkPanelProps {
  onNavigate: (x: number, y: number, zoom: number) => void;
  getMapState: () => { center: [number, number]; zoom: number } | null;
}

const BookmarkPanel = ({ onNavigate, getMapState }: BookmarkPanelProps) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setBookmarks(data);
      });
  }, [user]);

  const handleAdd = async () => {
    if (!user || !name.trim()) return;
    const state = getMapState();
    if (!state) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        name: name.trim(),
        center_x: state.center[0],
        center_y: state.center[1],
        zoom: state.zoom,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save bookmark");
      return;
    }
    setBookmarks((prev) => [...prev, data]);
    setName("");
    setAdding(false);
    toast.success("Bookmark saved!");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bookmarks
          </span>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-1.5 px-3 mb-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Bookmark name..."
            className="flex-1 bg-sidebar-accent border border-sidebar-border rounded px-2 py-1.5 text-xs text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      )}

      {bookmarks.map((b) => (
        <div
          key={b.id}
          className="group flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <button
            onClick={() => onNavigate(b.center_x, b.center_y, b.zoom)}
            className="flex-1 flex items-center gap-2 min-w-0 text-left"
          >
            <Navigation className="h-3 w-3 text-primary shrink-0" />
            <span className="text-sm text-sidebar-foreground truncate">{b.name}</span>
          </button>
          <button
            onClick={() => handleDelete(b.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      ))}

      {bookmarks.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground px-3 py-2 text-center">
          No bookmarks yet
        </p>
      )}
    </div>
  );
};

export default BookmarkPanel;

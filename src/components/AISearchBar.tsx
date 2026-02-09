import { useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISearchBarProps {
  onLayerFound: (layer: { id: string; url: string; title: string; color: string; type?: string }) => void;
}

const AISearchBar = ({ onLayerFound }: AISearchBarProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("geo-ai-search", {
        body: { query: query.trim() },
      });

      if (error) throw error;

      if (data?.layers && data.layers.length > 0) {
        for (const layer of data.layers) {
          onLayerFound({
            id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: layer.url,
            title: layer.title,
            color: layer.color || "hsl(270, 60%, 60%)",
            type: layer.type || "feature",
          });
        }
        toast.success(`Added ${data.layers.length} layer(s) from AI search`);
      } else {
        toast.info("No matching geospatial layers found. Try a different query.");
      }
    } catch (err: any) {
      console.error("AI search error:", err);
      toast.error("Failed to search for layers. Please try again.");
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Sparkles className="h-4 w-4 text-geo-purple" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Layer Search
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="e.g. wildfires in California..."
          className="w-full rounded-md bg-sidebar-accent border border-sidebar-border px-3 py-2.5 pr-10 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="absolute right-1.5 p-1.5 rounded-md text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
        Ask AI to find public ArcGIS data layers
      </p>
    </div>
  );
};

export default AISearchBar;

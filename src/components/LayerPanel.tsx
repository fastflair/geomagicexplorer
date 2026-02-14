import { useState } from "react";
import { Layers, Eye, EyeOff, Trash2, Sparkles, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import LayerFilter from "@/components/LayerFilter";

export interface LayerItem {
  id: string;
  url: string;
  title: string;
  visible: boolean;
  color: string;
  isAI?: boolean;
  type?: "feature" | "kml" | "geojson" | "csv" | "wms" | "wfs" | "map-image" | "ogc-feature" | "imagery-tile";
}

interface LayerPanelProps {
  layers: LayerItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onFilter?: (id: string, where: string | null) => void;
}

const LayerPanel = ({ layers, onToggle, onRemove, onFilter }: LayerPanelProps) => {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? layers.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()))
    : layers;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Layers className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data Layers
        </span>
      </div>

      {/* Search box */}
      {layers.length > 3 && (
        <div className="relative px-1 mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layers..."
            className="w-full bg-sidebar-accent border border-sidebar-border rounded-md pl-7 pr-3 py-1.5 text-xs text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      )}

      {filtered.map((layer) => (
        <div
          key={layer.id}
          className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-sidebar-accent"
        >
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: layer.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {layer.title}
              </span>
              {layer.isAI && (
                <Sparkles className="h-3 w-3 text-geo-purple shrink-0" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onFilter && (
              <LayerFilter
                layerId={layer.id}
                layerTitle={layer.title}
                onApplyFilter={onFilter}
              />
            )}
            {layer.isAI && (
              <button
                onClick={() => onRemove(layer.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            )}
            <Switch
              checked={layer.visible}
              onCheckedChange={() => onToggle(layer.id)}
              className="data-[state=checked]:bg-primary scale-75"
            />
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground px-3 py-4 text-center">
          {search ? "No matching layers" : "No layers added yet"}
        </p>
      )}
    </div>
  );
};

export default LayerPanel;

import { Layers, Eye, EyeOff, Trash2, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface LayerItem {
  id: string;
  url: string;
  title: string;
  visible: boolean;
  color: string;
  isAI?: boolean;
  type?: "feature" | "kml" | "geojson";
}

interface LayerPanelProps {
  layers: LayerItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const LayerPanel = ({ layers, onToggle, onRemove }: LayerPanelProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Layers className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data Layers
        </span>
      </div>
      {layers.map((layer) => (
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
          <div className="flex items-center gap-1.5">
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
      {layers.length === 0 && (
        <p className="text-xs text-muted-foreground px-3 py-4 text-center">
          No layers added yet
        </p>
      )}
    </div>
  );
};

export default LayerPanel;

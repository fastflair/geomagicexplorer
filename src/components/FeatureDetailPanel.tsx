import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeatureDetailPanelProps {
  title: string;
  attributes: Record<string, any>;
  onClose: () => void;
}

const SKIP_KEYS = new Set([
  "ObjectID", "OBJECTID", "FID", "Shape", "Shape_Length", "Shape_Area",
  "GlobalID", "SHAPE", "shape", "globalid",
]);

const formatValue = (value: any): string => {
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return String(value);
};

const formatKey = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const FeatureDetailPanel = ({ title, attributes, onClose }: FeatureDetailPanelProps) => {
  const entries = Object.entries(attributes).filter(
    ([k, v]) => !SKIP_KEYS.has(k) && v != null && v !== ""
  );

  if (entries.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-30 w-80 max-h-[60vh] rounded-lg border border-sidebar-border bg-card/95 backdrop-blur-md shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-sidebar/80">
        <h3 className="text-sm font-semibold text-primary truncate pr-2">{title}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Attributes */}
      <ScrollArea className="flex-1 max-h-[50vh]">
        <div className="px-4 py-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between gap-3 py-1.5 border-b border-border/40 last:border-0"
            >
              <span className="text-xs text-muted-foreground shrink-0 max-w-[40%] truncate">
                {formatKey(key)}
              </span>
              <span className="text-xs text-foreground text-right break-words max-w-[58%]">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-2 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground">
          {entries.length} attribute{entries.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default FeatureDetailPanel;

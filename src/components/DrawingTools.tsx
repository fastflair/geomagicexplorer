import { Pencil, Circle, Square, MapPin, X, Save, Trash2 } from "lucide-react";

export type DrawingMode = "point" | "polyline" | "polygon" | "circle" | null;

interface DrawingToolsProps {
  activeMode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onSave: () => void;
  onClear: () => void;
  hasDrawings: boolean;
}

const DrawingTools = ({ activeMode, onModeChange, onSave, onClear, hasDrawings }: DrawingToolsProps) => {
  const tools: { mode: DrawingMode; icon: typeof Pencil; label: string }[] = [
    { mode: "point", icon: MapPin, label: "Point" },
    { mode: "polyline", icon: Pencil, label: "Line" },
    { mode: "polygon", icon: Square, label: "Polygon" },
    { mode: "circle", icon: Circle, label: "Circle" },
  ];

  return (
    <div className="absolute top-16 right-4 z-20 flex flex-col gap-2">
      <div className="geo-panel rounded-md flex flex-col">
        {tools.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onModeChange(activeMode === mode ? null : mode)}
            className={`p-2 transition-colors first:rounded-t-md last:rounded-b-md ${
              activeMode === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            }`}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {hasDrawings && (
        <div className="geo-panel rounded-md flex flex-col">
          <button
            onClick={onSave}
            className="p-2 rounded-t-md text-muted-foreground hover:text-accent hover:bg-sidebar-accent transition-colors"
            title="Save Drawings"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={onClear}
            className="p-2 rounded-b-md text-muted-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors"
            title="Clear Drawings"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DrawingTools;

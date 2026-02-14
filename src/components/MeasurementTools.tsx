import { Ruler, Square, X } from "lucide-react";

interface MeasurementToolsProps {
  activeTool: "distance" | "area" | null;
  onActivate: (tool: "distance" | "area" | null) => void;
  measurement: string | null;
}

const MeasurementTools = ({ activeTool, onActivate, measurement }: MeasurementToolsProps) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      <div className="geo-panel rounded-md flex flex-col">
        <button
          onClick={() => onActivate(activeTool === "distance" ? null : "distance")}
          className={`p-2 rounded-t-md transition-colors ${
            activeTool === "distance"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          }`}
          title="Measure Distance"
        >
          <Ruler className="h-4 w-4" />
        </button>
        <button
          onClick={() => onActivate(activeTool === "area" ? null : "area")}
          className={`p-2 rounded-b-md transition-colors ${
            activeTool === "area"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          }`}
          title="Measure Area"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>

      {measurement && (
        <div className="geo-panel rounded-md px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-foreground font-mono">{measurement}</span>
          <button
            onClick={() => onActivate(null)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MeasurementTools;

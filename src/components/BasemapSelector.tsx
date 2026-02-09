import { Map } from "lucide-react";

export interface BasemapOption {
  id: string;
  label: string;
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  { id: "dark-gray-vector", label: "Dark Gray" },
  { id: "gray-vector", label: "Light Gray" },
  { id: "streets-vector", label: "Streets" },
  { id: "streets-night-vector", label: "Streets Night" },
  { id: "satellite", label: "Satellite" },
  { id: "hybrid", label: "Hybrid" },
  { id: "topo-vector", label: "Topographic" },
  { id: "oceans", label: "Oceans" },
  { id: "osm", label: "OpenStreetMap" },
  { id: "terrain", label: "Terrain" },
  { id: "navigation", label: "Navigation" },
  { id: "navigation-dark", label: "Navigation Dark" },
];

interface BasemapSelectorProps {
  selected: string;
  onChange: (id: string) => void;
}

const BasemapSelector = ({ selected, onChange }: BasemapSelectorProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Map className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Basemap
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {BASEMAP_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`text-xs px-2.5 py-2 rounded-md text-left transition-colors ${
              selected === opt.id
                ? "bg-primary/20 text-primary font-medium border border-primary/30"
                : "text-sidebar-foreground hover:bg-sidebar-accent border border-transparent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BasemapSelector;

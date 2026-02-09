import { useState, useCallback } from "react";
import { Globe, ChevronLeft, ChevronRight } from "lucide-react";
import MapView from "@/components/MapView";
import LayerPanel, { type LayerItem } from "@/components/LayerPanel";
import AISearchBar from "@/components/AISearchBar";

const DEFAULT_LAYERS: LayerItem[] = [
  {
    id: "earthquakes",
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USGS_Seismic_Data_v1/FeatureServer/0",
    title: "Recent Earthquakes",
    visible: true,
    color: "hsl(0, 75%, 58%)",
  },
  {
    id: "weather-stations",
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_702a5_gdb/FeatureServer/0",
    title: "NOAA Weather Stations",
    visible: false,
    color: "hsl(190, 90%, 55%)",
  },
  {
    id: "wildfires",
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0",
    title: "US Wildfires",
    visible: false,
    color: "hsl(25, 95%, 58%)",
  },
  {
    id: "us-power-plants",
    url: "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/us_power_plants/FeatureServer/0",
    title: "US Power Plants",
    visible: false,
    color: "hsl(45, 95%, 60%)",
  },
];

const Index = () => {
  const [layers, setLayers] = useState<LayerItem[]>(DEFAULT_LAYERS);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggle = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleAILayer = useCallback(
    (layer: { id: string; url: string; title: string; color: string; type?: string }) => {
      setLayers((prev) => [
        ...prev,
        { ...layer, visible: true, isAI: true, type: (layer.type as LayerItem["type"]) || "feature" },
      ]);
    },
    []
  );

  return (
    <div className="dark h-full flex relative">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 flex-shrink-0 overflow-hidden relative z-10`}
      >
        <div className="w-72 h-full bg-sidebar flex flex-col border-r border-sidebar-border">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border">
            <Globe className="h-5 w-5 text-primary animate-pulse-glow" />
            <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
              GeoExplorer
            </h1>
          </div>

          {/* Layers */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <LayerPanel
              layers={layers}
              onToggle={handleToggle}
              onRemove={handleRemove}
            />

            <div className="border-t border-sidebar-border pt-4">
              <AISearchBar onLayerFound={handleAILayer} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-sidebar-border">
            <p className="text-[10px] text-muted-foreground">
              Powered by ArcGIS &amp; Lovable AI
            </p>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 z-20 transition-all duration-300 geo-panel rounded-r-md p-1.5 hover:bg-sidebar-accent"
        style={{ left: sidebarOpen ? "288px" : "0" }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
        )}
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView layers={layers} onLayerError={handleRemove} />
      </div>
    </div>
  );
};

export default Index;

import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Globe, ChevronLeft, ChevronRight, LogOut, BookOpen } from "lucide-react";
import MapView, { type MapViewHandle } from "@/components/MapView";
import LayerPanel, { type LayerItem } from "@/components/LayerPanel";
import BasemapSelector from "@/components/BasemapSelector";
import AISearchBar from "@/components/AISearchBar";
import BookmarkPanel from "@/components/BookmarkPanel";
import ThemeToggle from "@/components/ThemeToggle";
import ShareExport from "@/components/ShareExport";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [basemapId, setBasemapId] = useState("dark-gray-vector");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const { user, signOut } = useAuth();
  const mapRef = useRef<MapViewHandle>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Load saved layers from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("saved_layers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load saved layers:", error);
        return;
      }
      if (data && data.length > 0) {
        const saved: LayerItem[] = data.map((r) => ({
          id: r.id,
          url: r.url,
          title: r.title,
          color: r.color,
          visible: r.visible,
          type: r.type as LayerItem["type"],
          isAI: r.is_ai,
        }));
        setLayers([...DEFAULT_LAYERS, ...saved]);
      }
    };
    load();
  }, [user]);

  const handleToggle = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, visible: !l.visible };
        if (l.isAI) {
          supabase.from("saved_layers").update({ visible: updated.visible }).eq("id", id).then();
        }
        return updated;
      })
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setLayers((prev) => {
      const layer = prev.find((l) => l.id === id);
      if (layer?.isAI) {
        supabase.from("saved_layers").delete().eq("id", id).then();
      }
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const handleAILayer = useCallback(
    async (layer: { id: string; url: string; title: string; color: string; type?: string }) => {
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_layers")
        .insert({
          user_id: user.id,
          url: layer.url,
          title: layer.title,
          color: layer.color,
          type: layer.type || "feature",
          visible: true,
          is_ai: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save layer:", error);
        toast.error("Failed to save layer");
        return;
      }

      setLayers((prev) => [
        ...prev,
        {
          id: data.id,
          url: data.url,
          title: data.title,
          color: data.color,
          visible: true,
          isAI: true,
          type: data.type as LayerItem["type"],
        },
      ]);
    },
    [user]
  );

  const handleFilter = useCallback((layerId: string, where: string | null) => {
    mapRef.current?.applyFilter(layerId, where);
  }, []);

  const getShareState = useCallback(() => {
    const state = mapRef.current?.getMapState();
    if (!state) return null;
    return {
      ...state,
      layers: layers.filter((l) => l.visible).map((l) => l.id),
    };
  }, [layers]);

  return (
    <div className={`${isDark ? "dark" : ""} h-full flex relative`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 flex-shrink-0 overflow-hidden relative z-10`}
      >
        <div className="w-72 h-full bg-sidebar flex flex-col border-r border-sidebar-border">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <Globe className="h-5 w-5 text-primary animate-pulse-glow" />
              <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
                GeoExplorer
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <ShareExport
                getMapState={getShareState}
                onExportImage={() => mapRef.current?.exportImage()}
              />
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
              <Link
                to="/tutorials"
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Tutorials"
              >
                <BookOpen className="h-4 w-4" />
              </Link>
              <button
                onClick={signOut}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <LayerPanel
              layers={layers}
              onToggle={handleToggle}
              onRemove={handleRemove}
              onFilter={handleFilter}
            />

            <div className="border-t border-sidebar-border pt-4">
              <BasemapSelector selected={basemapId} onChange={setBasemapId} />
            </div>

            <div className="border-t border-sidebar-border pt-4">
              <BookmarkPanel
                onNavigate={(x, y, zoom) => mapRef.current?.flyTo(x, y, zoom)}
                getMapState={() => mapRef.current?.getMapState() ?? null}
              />
            </div>

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
        <MapView
          ref={mapRef}
          layers={layers}
          basemapId={basemapId}
          onLayerError={handleRemove}
          showLegend={true}
        />
      </div>
    </div>
  );
};

export default Index;

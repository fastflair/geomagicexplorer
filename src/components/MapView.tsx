import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";
import FeatureDetailPanel from "./FeatureDetailPanel";
import CoordinateDisplay from "./CoordinateDisplay";
import MeasurementTools from "./MeasurementTools";
import DrawingTools, { type DrawingMode } from "./DrawingTools";
import LayerLegend from "./LayerLegend";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type LayerType = "feature" | "kml" | "geojson" | "csv" | "wms" | "wfs" | "map-image" | "ogc-feature" | "imagery-tile";

interface LayerConfig {
  id: string;
  url: string;
  title: string;
  visible: boolean;
  color?: string;
  type?: LayerType;
}

interface FeatureInfo {
  title: string;
  attributes: Record<string, any>;
  layerTitle: string;
  objectId: any;
  geometry?: any;
}

interface MapViewProps {
  layers: LayerConfig[];
  basemapId?: string;
  onMapReady?: () => void;
  onLayerError?: (id: string) => void;
  showLegend?: boolean;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(({ layers, basemapId = "dark-gray-vector", onMapReady, onLayerError, showLegend }, ref) => {
  const { user } = useAuth();
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const layerMapRef = useRef<Map<string, any>>(new Map());
  const loadingLayersRef = useRef<Set<string>>(new Set());
  const highlightHandleRef = useRef<any>(null);
  const measurementRef = useRef<any>(null);
  const sketchRef = useRef<any>(null);
  const graphicsLayerRef = useRef<any>(null);

  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [measureTool, setMeasureTool] = useState<"distance" | "area" | null>(null);
  const [measureResult, setMeasureResult] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [hasDrawings, setHasDrawings] = useState(false);

  useImperativeHandle(ref, () => ({
    getMapState: () => {
      const view = viewRef.current;
      if (!view) return null;
      return { center: [view.center.longitude, view.center.latitude] as [number, number], zoom: view.zoom };
    },
    flyTo: (x: number, y: number, zoom?: number) => {
      viewRef.current?.goTo({ center: [x, y], zoom: zoom ?? 12 }, { duration: 1500 });
    },
    exportImage: async () => {
      const view = viewRef.current;
      if (!view) return;
      try {
        const screenshot = await view.takeScreenshot({ format: "png" });
        const a = document.createElement("a");
        a.href = screenshot.dataUrl;
        a.download = "geoexplorer-map.png";
        a.click();
        toast.success("Map exported as image!");
      } catch {
        toast.error("Failed to export map");
      }
    },
    applyFilter: (layerId: string, where: string | null) => {
      const layer = layerMapRef.current.get(layerId);
      if (!layer) return;
      try {
        layer.definitionExpression = where || "1=1";
        toast.success(where ? `Filter applied to ${layer.title}` : `Filter cleared for ${layer.title}`);
      } catch {
        toast.error("Filtering not supported for this layer type");
      }
    },
  }));

  const getMapState = useCallback((): { center: [number, number]; zoom: number } | null => {
    const view = viewRef.current;
    if (!view) return null;
    return { center: [view.center.longitude, view.center.latitude], zoom: view.zoom };
  }, []);

  const flyTo = useCallback((x: number, y: number, zoom?: number) => {
    viewRef.current?.goTo({ center: [x, y], zoom: zoom ?? 12 }, { duration: 1500 });
  }, []);

  const initMap = useCallback(async () => {
    if (!mapDiv.current || viewRef.current) return;

    const esriId = await import("@arcgis/core/identity/IdentityManager").then((m) => m.default);
    esriId.destroyCredentials();
    (esriId as any).getCredential = () => Promise.reject(new Error("Auth suppressed"));
    (esriId as any).checkSignInStatus = () => Promise.reject(new Error("Auth suppressed"));

    const [Map, EsriMapView, GraphicsLayer] = await Promise.all([
      import("@arcgis/core/Map").then((m) => m.default),
      import("@arcgis/core/views/MapView").then((m) => m.default),
      import("@arcgis/core/layers/GraphicsLayer").then((m) => m.default),
    ]);

    const gfxLayer = new GraphicsLayer({ title: "Drawings" });
    graphicsLayerRef.current = gfxLayer;

    const map = new Map({ basemap: "dark-gray-vector", layers: [gfxLayer] });
    mapRef.current = map;

    const view = new EsriMapView({
      container: mapDiv.current,
      map,
      center: [-98.5, 39.8],
      zoom: 4,
      ui: { components: ["zoom", "compass"] },
      popup: { enabled: false } as any,
    });

    viewRef.current = view;
    await view.when();

    // Parse URL params for shared state
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const z = params.get("z");
    if (c && z) {
      const [lng, lat] = c.split(",").map(Number);
      if (!isNaN(lng) && !isNaN(lat)) {
        view.goTo({ center: [lng, lat], zoom: parseFloat(z) }, { duration: 0 });
      }
    }

    // Mouse move → coordinates
    view.on("pointer-move", (evt: any) => {
      const pt = view.toMap(evt);
      if (pt) setCoordinates({ lat: pt.latitude, lng: pt.longitude });
    });

    // Click handler
    view.on("click", async (evt: any) => {
      const response: any = await view.hitTest(evt);
      const result = response.results?.find((r: any) => r.graphic?.attributes && r.graphic?.layer && r.graphic.layer !== graphicsLayerRef.current);

      if (highlightHandleRef.current) {
        highlightHandleRef.current.remove();
        highlightHandleRef.current = null;
      }

      if (!result) {
        setSelectedFeature(null);
        restoreAllLayers();
        return;
      }

      const clickedLayer = result.graphic.layer;
      const clickedOid = result.graphic.attributes[clickedLayer.objectIdField || "OBJECTID"] ?? result.graphic.attributes["FID"];

      for (const [, layer] of layerMapRef.current) {
        if (!layer.visible) continue;
        if (layer === clickedLayer) {
          try {
            layer.featureEffect = {
              filter: { where: `${clickedLayer.objectIdField || "OBJECTID"} = ${clickedOid}` },
              excludedEffect: "grayscale(100%) opacity(0.25)",
              includedEffect: "brightness(1.2) drop-shadow(0px 0px 6px white)",
            };
          } catch { /* unsupported */ }
        } else {
          try {
            layer.featureEffect = { filter: { where: "1=0" }, excludedEffect: "grayscale(100%) opacity(0.25)" };
          } catch { layer.opacity = 0.2; }
        }
      }

      try {
        const layerView = await view.whenLayerView(clickedLayer);
        highlightHandleRef.current = layerView.highlight(result.graphic);
      } catch { /* no highlight */ }

      setSelectedFeature({
        title: clickedLayer.title || "Feature",
        attributes: { ...result.graphic.attributes },
        layerTitle: clickedLayer.title,
        objectId: clickedOid,
        geometry: result.graphic.geometry,
      });
    });

    // Load saved drawings
    if (user) {
      const { data } = await supabase.from("drawings").select("*").eq("user_id", user.id);
      if (data && data.length > 0) {
        const [Graphic] = await Promise.all([
          import("@arcgis/core/Graphic").then((m) => m.default),
        ]);
        for (const d of data) {
          const g = new Graphic({ geometry: d.geometry as any, symbol: d.symbol as any });
          gfxLayer.add(g);
        }
        setHasDrawings(true);
      }
    }

    onMapReady?.();
  }, [user]);

  const restoreAllLayers = useCallback(() => {
    for (const [, layer] of layerMapRef.current) {
      try { layer.featureEffect = null; } catch { /* */ }
      layer.opacity = 1;
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFeature(null);
    restoreAllLayers();
    if (highlightHandleRef.current) {
      highlightHandleRef.current.remove();
      highlightHandleRef.current = null;
    }
  }, [restoreAllLayers]);

  const handleFlyTo = useCallback(() => {
    if (!selectedFeature?.geometry || !viewRef.current) return;
    const geom = selectedFeature.geometry;
    const target = geom.type === "point" ? { center: [geom.longitude, geom.latitude], zoom: 12 } : geom.extent || geom;
    viewRef.current.goTo(target, { duration: 1500 });
  }, [selectedFeature]);

  // Measurement tool
  useEffect(() => {
    if (!viewRef.current) return;
    if (measurementRef.current) {
      measurementRef.current.destroy();
      measurementRef.current = null;
    }
    setMeasureResult(null);

    if (!measureTool) return;

    const loadMeasurement = async () => {
      const reactiveUtilsModule = await import("@arcgis/core/core/reactiveUtils");
      const reactiveUtils = (reactiveUtilsModule as any).default || reactiveUtilsModule;
      if (measureTool === "distance") {
        const DM = (await import("@arcgis/core/widgets/DistanceMeasurement2D")).default;
        const widget = new DM({ view: viewRef.current });
        measurementRef.current = widget;
        reactiveUtils.watch(
          () => (widget.viewModel as any).measurement,
          (m: any) => {
            if (m?.length) setMeasureResult(`${m.length.toFixed(2)} ${m.unit || "m"}`);
          }
        );
        (widget.viewModel as any).start();
      } else {
        const AM = (await import("@arcgis/core/widgets/AreaMeasurement2D")).default;
        const widget = new AM({ view: viewRef.current });
        measurementRef.current = widget;
        reactiveUtils.watch(
          () => (widget.viewModel as any).measurement,
          (m: any) => {
            if (m?.area) setMeasureResult(`${m.area.toFixed(2)} ${m.unit || "sq m"}`);
          }
        );
        (widget.viewModel as any).start();
      }
    };
    loadMeasurement();
  }, [measureTool]);

  // Drawing/Sketch tool
  useEffect(() => {
    if (!viewRef.current || !graphicsLayerRef.current) return;

    if (!drawingMode) {
      if (sketchRef.current) {
        sketchRef.current.destroy();
        sketchRef.current = null;
      }
      return;
    }

    const loadSketch = async () => {
      if (sketchRef.current) {
        sketchRef.current.destroy();
        sketchRef.current = null;
      }
      const Sketch = (await import("@arcgis/core/widgets/Sketch")).default;
      const sketch = new Sketch({
        view: viewRef.current,
        layer: graphicsLayerRef.current,
        creationMode: "single",
      });
      sketchRef.current = sketch;
      sketch.on("create", (evt: any) => {
        if (evt.state === "complete") {
          setHasDrawings(true);
        }
      });
      sketch.create(drawingMode as any);
    };
    loadSketch();
  }, [drawingMode]);

  const handleSaveDrawings = useCallback(async () => {
    if (!user || !graphicsLayerRef.current) return;
    const graphics = graphicsLayerRef.current.graphics.toArray();
    if (graphics.length === 0) return;

    // Clear existing saved drawings then re-save all
    await supabase.from("drawings").delete().eq("user_id", user.id);

    const inserts = graphics.map((g: any) => ({
      user_id: user.id,
      name: "Drawing",
      geometry: g.geometry.toJSON(),
      symbol: g.symbol?.toJSON() || null,
    }));

    const { error } = await supabase.from("drawings").insert(inserts);
    if (error) {
      toast.error("Failed to save drawings");
    } else {
      toast.success(`Saved ${inserts.length} drawing(s)`);
    }
  }, [user]);

  const handleClearDrawings = useCallback(() => {
    if (!graphicsLayerRef.current) return;
    graphicsLayerRef.current.removeAll();
    setHasDrawings(false);
    if (user) {
      supabase.from("drawings").delete().eq("user_id", user.id).then();
    }
  }, [user]);

  // Apply filter to a layer
  const applyFilter = useCallback((layerId: string, where: string | null) => {
    const layer = layerMapRef.current.get(layerId);
    if (!layer) return;
    try {
      layer.definitionExpression = where || "1=1";
      toast.success(where ? `Filter applied to ${layer.title}` : `Filter cleared for ${layer.title}`);
    } catch {
      toast.error("Filtering not supported for this layer type");
    }
  }, []);

  // Export map as image
  const handleExportImage = useCallback(async () => {
    const view = viewRef.current;
    if (!view) return;
    try {
      const screenshot = await view.takeScreenshot({ format: "png" });
      const a = document.createElement("a");
      a.href = screenshot.dataUrl;
      a.download = "geoexplorer-map.png";
      a.click();
      toast.success("Map exported as image!");
    } catch {
      toast.error("Failed to export map");
    }
  }, []);

  // Sync layer visibility + add/remove layers
  useEffect(() => {
    if (!mapRef.current) return;
    const currentIds = new Set(layers.map((l) => l.id));

    for (const [id, layer] of layerMapRef.current) {
      if (!currentIds.has(id)) {
        mapRef.current.remove(layer);
        layerMapRef.current.delete(id);
      }
    }

    for (const layerConfig of layers) {
      const existing = layerMapRef.current.get(layerConfig.id);
      if (existing) {
        existing.visible = layerConfig.visible;
      } else if (!loadingLayersRef.current.has(layerConfig.id)) {
        loadingLayersRef.current.add(layerConfig.id);

        Promise.all([
          import("@arcgis/core/layers/FeatureLayer").then((m) => m.default),
          import("@arcgis/core/layers/KMLLayer").then((m) => m.default),
          import("@arcgis/core/layers/GeoJSONLayer").then((m) => m.default),
          import("@arcgis/core/layers/CSVLayer").then((m) => m.default),
          import("@arcgis/core/layers/WMSLayer").then((m) => m.default),
          import("@arcgis/core/layers/WFSLayer").then((m) => m.default),
          import("@arcgis/core/layers/MapImageLayer").then((m) => m.default),
          import("@arcgis/core/layers/OGCFeatureLayer").then((m) => m.default),
          import("@arcgis/core/layers/ImageryTileLayer").then((m) => m.default),
        ]).then(([FL, KML, GJ, CSV, WMS, WFS, MI, OGC, IT]) => {
          const ctors: Record<string, any> = {
            feature: FL, kml: KML, geojson: GJ, csv: CSV,
            wms: WMS, wfs: WFS, "map-image": MI, "ogc-feature": OGC, "imagery-tile": IT,
          };
          const Ctor = ctors[layerConfig.type || "feature"] || FL;
          const base: any = { url: layerConfig.url, title: layerConfig.title, visible: layerConfig.visible };
          if (["feature", "wfs", "ogc-feature"].includes(layerConfig.type || "feature")) {
            base.outFields = ["*"];
            base.popupEnabled = false;
          }
          const fl = new Ctor(base);
          fl.load().then(() => {
            if (mapRef.current) {
              mapRef.current.add(fl);
              layerMapRef.current.set(layerConfig.id, fl);
            }
            loadingLayersRef.current.delete(layerConfig.id);
          }).catch((err: any) => {
            console.warn(`Layer "${layerConfig.title}" failed to load:`, err);
            toast.error(`Layer "${layerConfig.title}" could not be loaded — the service may be unavailable.`);
            loadingLayersRef.current.delete(layerConfig.id);
            onLayerError?.(layerConfig.id);
          });
        });
      }
    }
  }, [layers, onLayerError]);

  // Sync basemap
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.basemap = basemapId;
  }, [basemapId]);

  useEffect(() => {
    initMap();
    return () => {
      if (highlightHandleRef.current) highlightHandleRef.current.remove();
      if (measurementRef.current) measurementRef.current.destroy();
      if (sketchRef.current) sketchRef.current.destroy();
      viewRef.current?.destroy();
      viewRef.current = null;
      mapRef.current = null;
      layerMapRef.current.clear();
      loadingLayersRef.current.clear();
    };
  }, [initMap]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapDiv} className="h-full w-full" />

      {/* Coordinate Display */}
      <CoordinateDisplay coordinates={coordinates} onGoToCoordinate={(lat, lng) => flyTo(lng, lat)} />

      {/* Measurement */}
      <MeasurementTools activeTool={measureTool} onActivate={setMeasureTool} measurement={measureResult} />

      {/* Drawing */}
      <DrawingTools
        activeMode={drawingMode}
        onModeChange={setDrawingMode}
        onSave={handleSaveDrawings}
        onClear={handleClearDrawings}
        hasDrawings={hasDrawings}
      />

      {/* Legend */}
      {showLegend && !selectedFeature && (
        <LayerLegend layers={layers.map((l) => ({ id: l.id, title: l.title, color: l.color || "#3498db", visible: l.visible }))} />
      )}

      {/* Feature Detail Panel */}
      {selectedFeature && (
        <FeatureDetailPanel
          title={selectedFeature.title}
          attributes={selectedFeature.attributes}
          onClose={handleClose}
          onFlyTo={handleFlyTo}
        />
      )}
    </div>
  );
});

// Export refs for parent usage
export type MapViewHandle = {
  getMapState: () => { center: [number, number]; zoom: number } | null;
  flyTo: (x: number, y: number, zoom?: number) => void;
  exportImage: () => void;
  applyFilter: (layerId: string, where: string | null) => void;
};

MapView.displayName = "MapView";

export default MapView;

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type LayerType = "feature" | "kml" | "geojson" | "csv" | "wms" | "wfs" | "map-image" | "ogc-feature" | "imagery-tile";

interface LayerConfig {
  id: string;
  url: string;
  title: string;
  visible: boolean;
  type?: LayerType;
}

interface MapViewProps {
  layers: LayerConfig[];
  basemapId?: string;
  onMapReady?: () => void;
  onLayerError?: (id: string) => void;
}

const MapView = ({ layers, basemapId = "dark-gray-vector", onMapReady, onLayerError }: MapViewProps) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const layerMapRef = useRef<Map<string, any>>(new Map());

  const initMap = useCallback(async () => {
    if (!mapDiv.current || viewRef.current) return;

    // Suppress ArcGIS identity manager popup for layers requiring auth
    const esriId = await import("@arcgis/core/identity/IdentityManager").then((m) => m.default);
    esriId.destroyCredentials();
    (esriId as any).getCredential = () => Promise.reject(new Error("Auth suppressed"));
    (esriId as any).checkSignInStatus = () => Promise.reject(new Error("Auth suppressed"));

    const [Map, MapView, FeatureLayer, Basemap, VectorTileLayer, KMLLayer, GeoJSONLayer, CSVLayer, WMSLayer, WFSLayer, MapImageLayer, OGCFeatureLayer, ImageryTileLayer] = await Promise.all([
      import("@arcgis/core/Map").then((m) => m.default),
      import("@arcgis/core/views/MapView").then((m) => m.default),
      import("@arcgis/core/layers/FeatureLayer").then((m) => m.default),
      import("@arcgis/core/Basemap").then((m) => m.default),
      import("@arcgis/core/layers/VectorTileLayer").then((m) => m.default),
      import("@arcgis/core/layers/KMLLayer").then((m) => m.default),
      import("@arcgis/core/layers/GeoJSONLayer").then((m) => m.default),
      import("@arcgis/core/layers/CSVLayer").then((m) => m.default),
      import("@arcgis/core/layers/WMSLayer").then((m) => m.default),
      import("@arcgis/core/layers/WFSLayer").then((m) => m.default),
      import("@arcgis/core/layers/MapImageLayer").then((m) => m.default),
      import("@arcgis/core/layers/OGCFeatureLayer").then((m) => m.default),
      import("@arcgis/core/layers/ImageryTileLayer").then((m) => m.default),
    ]);

    const basemap = new Basemap({
      baseLayers: [
        new VectorTileLayer({
          url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
        }),
      ],
    });

    const map = new Map({ basemap: "dark-gray-vector" });
    mapRef.current = map;

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: [-98.5, 39.8],
      zoom: 4,
      ui: { components: ["zoom", "compass"] },
      popup: {
        dockEnabled: true,
        dockOptions: { position: "bottom-right", breakpoint: false },
      },
    });

    viewRef.current = view;

    const layerCtors: Record<string, any> = {
      feature: FeatureLayer, kml: KMLLayer, geojson: GeoJSONLayer,
      csv: CSVLayer, wms: WMSLayer, wfs: WFSLayer,
      "map-image": MapImageLayer, "ogc-feature": OGCFeatureLayer, "imagery-tile": ImageryTileLayer,
    };

    const createLayer = (config: LayerConfig) => {
      const Ctor = layerCtors[config.type || "feature"] || FeatureLayer;
      const base: any = { url: config.url, title: config.title, visible: config.visible };
      if (["feature", "wfs", "ogc-feature"].includes(config.type || "feature")) {
        base.outFields = ["*"];
        base.popupEnabled = true;
      }
      return new Ctor(base);
    };

    for (const layerConfig of layers) {
      const fl = createLayer(layerConfig);
      fl.load().then(() => {
        map.add(fl);
        layerMapRef.current.set(layerConfig.id, fl);
      }).catch((err: any) => {
        console.warn(`Layer "${layerConfig.title}" failed to load:`, err);
        const msg = err?.details?.raw?.message || err?.message || "";
        if (msg.toLowerCase().includes("token")) {
          toast.error(`Layer "${layerConfig.title}" requires authentication and was removed.`);
        } else {
          toast.error(`Layer "${layerConfig.title}" could not be loaded — the service may be unavailable.`);
        }
        onLayerError?.(layerConfig.id);
      });
    }

    await view.when();

    // Hover tooltip: show feature details on pointer-move
    let hoverHandle: any = null;
    const tooltip = document.createElement("div");
    tooltip.className = "map-hover-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;display:none;z-index:50;" +
      "background:hsl(220 25% 10%/0.92);backdrop-filter:blur(8px);" +
      "border:1px solid hsl(220 20% 22%);border-radius:6px;" +
      "padding:8px 12px;max-width:280px;font-size:12px;color:hsl(210 20% 88%);" +
      "box-shadow:0 4px 16px hsl(0 0% 0%/0.4);";
    mapDiv.current?.appendChild(tooltip);

    view.on("pointer-move", (evt: any) => {
      if (hoverHandle) { hoverHandle.remove(); hoverHandle = null; }
      hoverHandle = view.hitTest(evt).then((response: any) => {
        const result = response.results?.find((r: any) => r.graphic?.attributes);
        if (!result) {
          tooltip.style.display = "none";
          return;
        }
        const attrs = result.graphic.attributes;
        const layerTitle = result.graphic.layer?.title || "Feature";
        // Build tooltip content — show up to 6 key attributes
        const skipKeys = new Set(["ObjectID", "OBJECTID", "FID", "Shape", "Shape_Length", "Shape_Area", "GlobalID"]);
        const entries = Object.entries(attrs)
          .filter(([k]) => !skipKeys.has(k) && attrs[k] != null && attrs[k] !== "")
          .slice(0, 6);
        if (entries.length === 0) {
          tooltip.style.display = "none";
          return;
        }
        tooltip.innerHTML =
          `<div style="font-weight:600;margin-bottom:4px;color:hsl(200 80% 60%);font-size:11px;text-transform:uppercase;letter-spacing:0.5px">${layerTitle}</div>` +
          entries
            .map(([k, v]) => `<div style="display:flex;gap:6px;line-height:1.4"><span style="color:hsl(215 15% 55%);flex-shrink:0">${k}:</span><span style="word-break:break-word">${v}</span></div>`)
            .join("");
        tooltip.style.display = "block";
        tooltip.style.left = evt.x + 14 + "px";
        tooltip.style.top = evt.y + 14 + "px";
      });
    });

    view.on("pointer-leave", () => { tooltip.style.display = "none"; });

    onMapReady?.();
  }, []);

  // Sync layer visibility
  useEffect(() => {
    for (const layerConfig of layers) {
      const existing = layerMapRef.current.get(layerConfig.id);
      if (existing) {
        existing.visible = layerConfig.visible;
      } else if (mapRef.current) {
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
            base.popupEnabled = true;
          }
          const fl = new Ctor(base);
          fl.load().then(() => {
            mapRef.current.add(fl);
            layerMapRef.current.set(layerConfig.id, fl);
          }).catch((err: any) => {
            console.warn(`Layer "${layerConfig.title}" failed to load:`, err);
            toast.error(`Layer "${layerConfig.title}" could not be loaded — the service may be unavailable.`);
            onLayerError?.(layerConfig.id);
          });
        });
      }
    }
  }, [layers]);

  // Sync basemap changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.basemap = basemapId;
  }, [basemapId]);

  useEffect(() => {
    initMap();
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
      mapRef.current = null;
      layerMapRef.current.clear();
    };
  }, [initMap]);

  return <div ref={mapDiv} className="h-full w-full" />;
};

export default MapView;

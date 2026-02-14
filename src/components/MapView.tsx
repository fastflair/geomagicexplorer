import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import FeatureDetailPanel from "./FeatureDetailPanel";

type LayerType = "feature" | "kml" | "geojson" | "csv" | "wms" | "wfs" | "map-image" | "ogc-feature" | "imagery-tile";

interface LayerConfig {
  id: string;
  url: string;
  title: string;
  visible: boolean;
  type?: LayerType;
}

interface FeatureInfo {
  title: string;
  attributes: Record<string, any>;
  layerTitle: string;
  objectId: any;
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
  const loadingLayersRef = useRef<Set<string>>(new Set());
  const highlightHandleRef = useRef<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);

  const initMap = useCallback(async () => {
    if (!mapDiv.current || viewRef.current) return;

    const esriId = await import("@arcgis/core/identity/IdentityManager").then((m) => m.default);
    esriId.destroyCredentials();
    (esriId as any).getCredential = () => Promise.reject(new Error("Auth suppressed"));
    (esriId as any).checkSignInStatus = () => Promise.reject(new Error("Auth suppressed"));

    const [Map, EsriMapView, FeatureLayer, , , KMLLayer, GeoJSONLayer, CSVLayer, WMSLayer, WFSLayer, MapImageLayer, OGCFeatureLayer, ImageryTileLayer] = await Promise.all([
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

    const map = new Map({ basemap: "dark-gray-vector" });
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

    // Click handler with highlight/grey-out
    view.on("click", async (evt: any) => {
      const response: any = await view.hitTest(evt);
      const result = response.results?.find((r: any) => r.graphic?.attributes && r.graphic?.layer);

      // Remove previous highlight
      if (highlightHandleRef.current) {
        highlightHandleRef.current.remove();
        highlightHandleRef.current = null;
      }

      if (!result) {
        // Clear selection — restore all layers to full opacity
        setSelectedFeature(null);
        restoreAllLayers();
        return;
      }

      const clickedLayer = result.graphic.layer;
      const clickedOid = result.graphic.attributes[clickedLayer.objectIdField || "OBJECTID"] ?? result.graphic.attributes["FID"];

      // Grey out all other layers, dim non-selected features on clicked layer
      for (const [, layer] of layerMapRef.current) {
        if (!layer.visible) continue;
        if (layer === clickedLayer) {
          // Use featureEffect to grey out non-selected features
          try {
            layer.featureEffect = {
              filter: {
                where: `${clickedLayer.objectIdField || "OBJECTID"} = ${clickedOid}`,
              },
              excludedEffect: "grayscale(100%) opacity(0.25)",
              includedEffect: "brightness(1.2) drop-shadow(0px 0px 6px white)",
            };
          } catch {
            // featureEffect not supported on this layer type
          }
        } else {
          // Dim other layers
          try {
            layer.featureEffect = {
              filter: { where: "1=0" },
              excludedEffect: "grayscale(100%) opacity(0.25)",
            };
          } catch {
            layer.opacity = 0.2;
          }
        }
      }

      // Highlight the clicked feature
      try {
        const layerView = await view.whenLayerView(clickedLayer);
        highlightHandleRef.current = layerView.highlight(result.graphic);
      } catch {
        // highlight not supported
      }

      setSelectedFeature({
        title: clickedLayer.title || "Feature",
        attributes: { ...result.graphic.attributes },
        layerTitle: clickedLayer.title,
        objectId: clickedOid,
      });
    });

    onMapReady?.();
  }, []);

  const restoreAllLayers = useCallback(() => {
    for (const [, layer] of layerMapRef.current) {
      try {
        layer.featureEffect = null;
      } catch {
        // ignore
      }
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

  // Sync layer visibility + add/remove layers
  useEffect(() => {
    if (!mapRef.current) return;

    const currentIds = new Set(layers.map((l) => l.id));

    // Remove layers no longer in config
    for (const [id, layer] of layerMapRef.current) {
      if (!currentIds.has(id)) {
        mapRef.current.remove(layer);
        layerMapRef.current.delete(id);
      }
    }

    // Update existing or add new
    for (const layerConfig of layers) {
      const existing = layerMapRef.current.get(layerConfig.id);
      if (existing) {
        existing.visible = layerConfig.visible;
      } else if (!loadingLayersRef.current.has(layerConfig.id)) {
        // Mark as loading to prevent duplicates
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

  // Sync basemap changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.basemap = basemapId;
  }, [basemapId]);

  useEffect(() => {
    initMap();
    return () => {
      if (highlightHandleRef.current) {
        highlightHandleRef.current.remove();
      }
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
      {selectedFeature && (
        <FeatureDetailPanel
          title={selectedFeature.title}
          attributes={selectedFeature.attributes}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default MapView;

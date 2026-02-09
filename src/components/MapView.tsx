import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface LayerConfig {
  id: string;
  url: string;
  title: string;
  visible: boolean;
  type?: "feature" | "kml" | "geojson";
}

interface MapViewProps {
  layers: LayerConfig[];
  onMapReady?: () => void;
  onLayerError?: (id: string) => void;
}

const MapView = ({ layers, onMapReady, onLayerError }: MapViewProps) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const layerMapRef = useRef<Map<string, any>>(new Map());

  const initMap = useCallback(async () => {
    if (!mapDiv.current || viewRef.current) return;

    const [Map, MapView, FeatureLayer, Basemap, VectorTileLayer, KMLLayer, GeoJSONLayer] = await Promise.all([
      import("@arcgis/core/Map").then((m) => m.default),
      import("@arcgis/core/views/MapView").then((m) => m.default),
      import("@arcgis/core/layers/FeatureLayer").then((m) => m.default),
      import("@arcgis/core/Basemap").then((m) => m.default),
      import("@arcgis/core/layers/VectorTileLayer").then((m) => m.default),
      import("@arcgis/core/layers/KMLLayer").then((m) => m.default),
      import("@arcgis/core/layers/GeoJSONLayer").then((m) => m.default),
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

    const createLayer = (config: LayerConfig, FL: any, KML: any, GJ: any) => {
      const layerType = config.type || "feature";
      if (layerType === "kml") {
        return new KML({ url: config.url, title: config.title, visible: config.visible });
      } else if (layerType === "geojson") {
        return new GJ({ url: config.url, title: config.title, visible: config.visible });
      } else {
        return new FL({ url: config.url, title: config.title, visible: config.visible, outFields: ["*"], popupEnabled: true });
      }
    };

    for (const layerConfig of layers) {
      const fl = createLayer(layerConfig, FeatureLayer, KMLLayer, GeoJSONLayer);
      fl.load().then(() => {
        map.add(fl);
        layerMapRef.current.set(layerConfig.id, fl);
      }).catch((err: any) => {
        console.warn(`Layer "${layerConfig.title}" failed to load:`, err);
        toast.error(`Layer "${layerConfig.title}" could not be loaded — the service may be unavailable.`);
        onLayerError?.(layerConfig.id);
      });
    }

    await view.when();
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
        ]).then(([FL, KML, GJ]) => {
          const layerType = layerConfig.type || "feature";
          let fl: any;
          if (layerType === "kml") {
            fl = new KML({ url: layerConfig.url, title: layerConfig.title, visible: layerConfig.visible });
          } else if (layerType === "geojson") {
            fl = new GJ({ url: layerConfig.url, title: layerConfig.title, visible: layerConfig.visible });
          } else {
            fl = new FL({ url: layerConfig.url, title: layerConfig.title, visible: layerConfig.visible, outFields: ["*"], popupEnabled: true });
          }
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

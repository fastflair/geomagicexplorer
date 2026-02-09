import { useEffect, useRef, useCallback } from "react";

interface LayerConfig {
  id: string;
  url: string;
  title: string;
  visible: boolean;
}

interface MapViewProps {
  layers: LayerConfig[];
  onMapReady?: () => void;
}

const MapView = ({ layers, onMapReady }: MapViewProps) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const layerMapRef = useRef<Map<string, any>>(new Map());

  const initMap = useCallback(async () => {
    if (!mapDiv.current || viewRef.current) return;

    const [Map, MapView, FeatureLayer, Basemap, VectorTileLayer] = await Promise.all([
      import("@arcgis/core/Map").then((m) => m.default),
      import("@arcgis/core/views/MapView").then((m) => m.default),
      import("@arcgis/core/layers/FeatureLayer").then((m) => m.default),
      import("@arcgis/core/Basemap").then((m) => m.default),
      import("@arcgis/core/layers/VectorTileLayer").then((m) => m.default),
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

    // Add initial layers
    for (const layerConfig of layers) {
      const fl = new FeatureLayer({
        url: layerConfig.url,
        title: layerConfig.title,
        visible: layerConfig.visible,
        outFields: ["*"],
        popupEnabled: true,
      });
      map.add(fl);
      layerMapRef.current.set(layerConfig.id, fl);
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
        // Dynamically add new layer
        import("@arcgis/core/layers/FeatureLayer").then(({ default: FeatureLayer }) => {
          const fl = new FeatureLayer({
            url: layerConfig.url,
            title: layerConfig.title,
            visible: layerConfig.visible,
            outFields: ["*"],
            popupEnabled: true,
          });
          mapRef.current.add(fl);
          layerMapRef.current.set(layerConfig.id, fl);
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

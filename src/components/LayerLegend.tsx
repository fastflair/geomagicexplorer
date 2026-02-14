import { Info } from "lucide-react";

interface LayerLegendItem {
  id: string;
  title: string;
  color: string;
  visible: boolean;
}

interface LayerLegendProps {
  layers: LayerLegendItem[];
}

const LayerLegend = ({ layers }: LayerLegendProps) => {
  const visibleLayers = layers.filter((l) => l.visible);
  if (visibleLayers.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-20 geo-panel rounded-md px-3 py-2 max-w-[200px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Info className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Legend
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {visibleLayers.map((layer) => (
          <div key={layer.id} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-[11px] text-foreground truncate">{layer.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerLegend;

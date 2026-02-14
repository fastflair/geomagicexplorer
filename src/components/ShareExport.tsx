import { useState } from "react";
import { Share2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareExportProps {
  getMapState: () => { center: [number, number]; zoom: number; layers: string[] } | null;
  onExportImage: () => void;
}

const ShareExport = ({ getMapState, onExportImage }: ShareExportProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareLink = () => {
    const state = getMapState();
    if (!state) return;
    const params = new URLSearchParams({
      c: `${state.center[0].toFixed(4)},${state.center[1].toFixed(4)}`,
      z: state.zoom.toFixed(1),
      l: state.layers.join(","),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        title="Share & Export"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 geo-panel rounded-md p-2 flex flex-col gap-1 min-w-[160px] z-50">
          <button
            onClick={handleShareLink}
            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground rounded hover:bg-sidebar-accent transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
            Copy Share Link
          </button>
          <button
            onClick={() => {
              onExportImage();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground rounded hover:bg-sidebar-accent transition-colors"
          >
            <Download className="h-3 w-3" />
            Export as Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareExport;

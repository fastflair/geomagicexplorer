import { useState } from "react";
import { MapPin, Search } from "lucide-react";

interface CoordinateDisplayProps {
  coordinates: { lat: number; lng: number } | null;
  onGoToCoordinate: (lat: number, lng: number) => void;
}

const CoordinateDisplay = ({ coordinates, onGoToCoordinate }: CoordinateDisplayProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");

  const handleGo = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      onGoToCoordinate(lat, lng);
      setSearchOpen(false);
      setLatInput("");
      setLngInput("");
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
      {/* Coordinate readout */}
      <div className="geo-panel rounded-md px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 text-primary" />
        {coordinates ? (
          <span className="font-mono">
            {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
          </span>
        ) : (
          <span>Move mouse over map</span>
        )}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="ml-1 p-1 rounded hover:bg-sidebar-accent transition-colors"
          title="Go to coordinates"
        >
          <Search className="h-3 w-3" />
        </button>
      </div>

      {/* Coordinate search */}
      {searchOpen && (
        <div className="geo-panel rounded-md px-3 py-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Lat"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            className="w-20 bg-transparent border border-sidebar-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Lng"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="w-20 bg-transparent border border-sidebar-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleGo}
            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
};

export default CoordinateDisplay;

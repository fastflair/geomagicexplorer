import { useState } from "react";
import { Filter, X } from "lucide-react";

interface LayerFilterProps {
  layerId: string;
  layerTitle: string;
  onApplyFilter: (layerId: string, where: string | null) => void;
}

const LayerFilter = ({ layerId, layerTitle, onApplyFilter }: LayerFilterProps) => {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState("");
  const [operator, setOperator] = useState(">");
  const [value, setValue] = useState("");

  const handleApply = () => {
    if (!field.trim() || !value.trim()) return;
    const where = `${field} ${operator} ${isNaN(Number(value)) ? `'${value}'` : value}`;
    onApplyFilter(layerId, where);
    setOpen(false);
  };

  const handleClear = () => {
    onApplyFilter(layerId, null);
    setField("");
    setValue("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
        title={`Filter ${layerTitle}`}
      >
        <Filter className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 geo-panel rounded-md p-3 z-50 min-w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Filter: {layerTitle}</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              placeholder="Field name (e.g. mag)"
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="bg-sidebar-accent border border-sidebar-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-1.5">
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="bg-sidebar-accent border border-sidebar-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value=">">&gt;</option>
                <option value=">=">&gt;=</option>
                <option value="<">&lt;</option>
                <option value="<=">&lt;=</option>
                <option value="=">=</option>
                <option value="<>">&lt;&gt;</option>
                <option value="LIKE">LIKE</option>
              </select>
              <input
                type="text"
                placeholder="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className="flex-1 bg-sidebar-accent border border-sidebar-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleApply}
                className="flex-1 px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={handleClear}
                className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-sidebar-border rounded hover:bg-sidebar-accent transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerFilter;

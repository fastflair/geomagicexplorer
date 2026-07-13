import { useEffect, useMemo, useRef, useState } from "react";
import { X, Network, Loader2, RefreshCw } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface KGNode {
  id: string;
  node_type: string;
  label: string;
  properties: any;
}

interface KGEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  relation: string;
}

interface KnowledgeGraphViewProps {
  open: boolean;
  onClose: () => void;
}

const NODE_COLORS: Record<string, string> = {
  layer: "hsl(200, 80%, 55%)",
  topic: "hsl(270, 70%, 65%)",
  place: "hsl(145, 65%, 55%)",
  feature: "hsl(25, 95%, 60%)",
  insight: "hsl(45, 95%, 60%)",
};

const KnowledgeGraphView = ({ open, onClose }: KnowledgeGraphViewProps) => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<KGNode[]>([]);
  const [edges, setEdges] = useState<KGEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: n }, { data: e }] = await Promise.all([
      supabase
        .from("kg_nodes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("kg_edges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);
    setNodes(n || []);
    setEdges(e || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [open]);

  const graphData = useMemo(() => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.node_type,
        color: NODE_COLORS[n.node_type] || "hsl(0, 0%, 60%)",
        val: n.node_type === "layer" ? 6 : 3,
      })),
      links: edges
        .filter(
          (e) =>
            nodes.some((n) => n.id === e.from_node_id) &&
            nodes.some((n) => n.id === e.to_node_id)
        )
        .map((e) => ({
          source: e.from_node_id,
          target: e.to_node_id,
          relation: e.relation,
        })),
    };
  }, [nodes, edges]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Network className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Knowledge Graph
          </h2>
          <span className="text-xs text-muted-foreground">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            title="Refresh"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-border text-xs">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {nodes.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <Network className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground max-w-sm">
                Your knowledge graph is empty. Add layers with the AI search or
                chat with the Map Agent — every layer, topic, and place you
                explore gets recorded here.
              </p>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            width={dims.w}
            height={dims.h}
            graphData={graphData}
            nodeLabel={(n: any) => `${n.type}: ${n.label}`}
            nodeColor={(n: any) => n.color}
            linkColor={() => "hsla(220, 15%, 45%, 0.5)"}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkLabel={(l: any) => l.relation}
            onNodeClick={(n: any) =>
              setSelectedNode(nodes.find((x) => x.id === n.id) || null)
            }
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.label;
              const fontSize = 11 / globalScale;
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "hsl(210, 20%, 90%)";
              ctx.fillText(label, node.x, node.y + node.val + 4);
            }}
            backgroundColor="transparent"
            cooldownTicks={100}
          />
        )}

        {/* Selected node inspector */}
        {selectedNode && (
          <div className="absolute top-4 left-4 max-w-xs bg-card border border-border rounded-lg p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                {selectedNode.node_type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <h3 className="font-semibold text-foreground mb-2 break-words">
              {selectedNode.label}
            </h3>
            {selectedNode.properties &&
              Object.keys(selectedNode.properties).length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {Object.entries(selectedNode.properties)
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-muted-foreground/70">{k}</span>
                        <span className="text-foreground/80 text-right break-all">
                          {typeof v === "object"
                            ? JSON.stringify(v)
                            : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphView;

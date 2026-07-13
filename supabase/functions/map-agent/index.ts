import { generateText, tool, stepCountIs } from "npm:ai@7";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@3";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VisibleLayer {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface AgentAction {
  type: "add_layer" | "fly_to" | "highlight_layer" | "record_kg";
  [key: string]: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      messages,
      visibleLayers = [],
      mapExtent,
    }: {
      messages: { role: "user" | "assistant"; content: string }[];
      visibleLayers: VisibleLayer[];
      mapExtent?: { center: [number, number]; zoom: number };
    } = body;

    // Extract JWT for RLS-scoped KG writes
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Resolve user id from JWT so we can scope KG writes
    const { data: userData } = await supabase.auth.getUser(jwt);
    const userId = userData?.user?.id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    const model = gateway("google/gemini-2.5-flash");

    // Collect actions from tool executions
    const actions: AgentAction[] = [];

    const ensureNode = async (
      nodeType: string,
      label: string,
      externalRef?: string,
      properties: Record<string, any> = {}
    ): Promise<string | null> => {
      if (!userId) return null;
      const { data: existing } = await supabase
        .from("kg_nodes")
        .select("id")
        .eq("user_id", userId)
        .eq("node_type", nodeType)
        .eq("label", label)
        .maybeSingle();
      if (existing?.id) return existing.id;

      const { data: created } = await supabase
        .from("kg_nodes")
        .insert({
          user_id: userId,
          node_type: nodeType,
          label,
          external_ref: externalRef,
          properties,
        })
        .select("id")
        .single();
      return created?.id ?? null;
    };

    const ensureEdge = async (
      fromId: string,
      toId: string,
      relation: string
    ) => {
      if (!userId) return;
      await supabase.from("kg_edges").upsert(
        {
          user_id: userId,
          from_node_id: fromId,
          to_node_id: toId,
          relation,
        },
        { onConflict: "user_id,from_node_id,to_node_id,relation" }
      );
    };

    const tools = {
      list_visible_layers: tool({
        description:
          "Return the layers currently visible on the user's map, with URL and type.",
        inputSchema: z.object({}),
        execute: async () => ({
          layers: visibleLayers,
          extent: mapExtent ?? null,
        }),
      }),

      query_feature_count: tool({
        description:
          "Count features in a layer matching a SQL-like WHERE clause. Use for questions like 'how many earthquakes above magnitude 4?'.",
        inputSchema: z.object({
          layer_url: z
            .string()
            .describe("Full FeatureServer layer URL ending in /0"),
          where: z
            .string()
            .describe("SQL where clause, e.g. \"mag > 4\" or \"1=1\" for all"),
        }),
        execute: async ({ layer_url, where }) => {
          const url = new URL(`${layer_url}/query`);
          url.searchParams.set("where", where);
          url.searchParams.set("returnCountOnly", "true");
          url.searchParams.set("f", "json");
          try {
            const res = await fetch(url.toString());
            const data = await res.json();
            return { count: data.count ?? 0, where, layer_url };
          } catch (e) {
            return { error: String(e), count: 0 };
          }
        },
      }),

      query_sample_features: tool({
        description:
          "Fetch a small sample of features (max 5) from a layer to inspect their attributes.",
        inputSchema: z.object({
          layer_url: z.string(),
          where: z.string(),
          fields: z
            .string()
            .describe("Comma-separated field names or '*' for all"),
        }),
        execute: async ({ layer_url, where, fields }) => {
          const url = new URL(`${layer_url}/query`);
          url.searchParams.set("where", where);
          url.searchParams.set("outFields", fields);
          url.searchParams.set("resultRecordCount", "5");
          url.searchParams.set("returnGeometry", "false");
          url.searchParams.set("f", "json");
          try {
            const res = await fetch(url.toString());
            const data = await res.json();
            return {
              features: (data.features || []).map((f: any) => f.attributes),
            };
          } catch (e) {
            return { error: String(e), features: [] };
          }
        },
      }),

      search_arcgis_hub: tool({
        description:
          "Search the ArcGIS Hub catalog for real, publicly-available geospatial layers matching a topic.",
        inputSchema: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          const searchUrl = new URL(
            "https://www.arcgis.com/sharing/rest/search"
          );
          searchUrl.searchParams.set(
            "q",
            `${query} type:("Feature Service" OR "Map Service" OR "KML" OR "GeoJSON")`
          );
          searchUrl.searchParams.set("num", "5");
          searchUrl.searchParams.set("sortField", "numViews");
          searchUrl.searchParams.set("sortOrder", "desc");
          searchUrl.searchParams.set("f", "json");
          const res = await fetch(searchUrl.toString());
          const data = await res.json();
          return {
            results: (data.results || []).slice(0, 5).map((r: any) => ({
              title: r.title,
              url: r.url,
              type: r.type,
              snippet: r.snippet,
            })),
          };
        },
      }),

      add_layer_to_map: tool({
        description:
          "Add a discovered layer to the user's map. Only call after search_arcgis_hub returned a valid URL.",
        inputSchema: z.object({
          url: z.string(),
          title: z.string(),
          type: z
            .enum([
              "feature",
              "kml",
              "geojson",
              "csv",
              "wms",
              "wfs",
              "map-image",
              "imagery-tile",
            ])
            .describe(
              "Layer type. Map ArcGIS 'Feature Service' → 'feature', 'Map Service' → 'map-image', etc."
            ),
          color: z
            .string()
            .describe("Distinctive hex color like #e94560"),
        }),
        execute: async ({ url, title, type, color }) => {
          // Normalize FeatureServer URL to /0
          let finalUrl = url;
          if (type === "feature" && !url.match(/\/\d+$/)) {
            finalUrl = url.endsWith("/") ? url + "0" : url + "/0";
          }
          actions.push({
            type: "add_layer",
            url: finalUrl,
            title,
            layerType: type,
            color,
          });

          // Record in KG
          if (userId) {
            const layerNode = await ensureNode(
              "layer",
              title,
              finalUrl,
              { color, type }
            );
            const topicNode = await ensureNode("topic", title.split(" ")[0]);
            if (layerNode && topicNode)
              await ensureEdge(layerNode, topicNode, "covers_topic");
          }

          return { success: true, added: title };
        },
      }),

      fly_to_location: tool({
        description:
          "Smoothly fly the map to a location. Use for 'zoom to California' etc.",
        inputSchema: z.object({
          longitude: z.number(),
          latitude: z.number(),
          zoom: z
            .number()
            .describe("Zoom level 1-18. Use 5 for state, 10 for city, 14 for neighborhood."),
          label: z
            .string()
            .describe("Human-readable place name for the KG"),
        }),
        execute: async ({ longitude, latitude, zoom, label }) => {
          actions.push({
            type: "fly_to",
            longitude,
            latitude,
            zoom,
            label,
          });
          if (userId) {
            await ensureNode("place", label, undefined, {
              longitude,
              latitude,
              zoom,
            });
          }
          return { success: true, flew_to: label };
        },
      }),

      record_relationship: tool({
        description:
          "Record a relationship between two entities in the user's knowledge graph. Use to remember insights like 'wildfires occur near power plants in California'.",
        inputSchema: z.object({
          subject_type: z.enum(["layer", "topic", "place", "feature", "insight"]),
          subject_label: z.string(),
          relation: z.string().describe("A short lowercase verb-phrase like 'near', 'overlaps_with', 'located_in'"),
          object_type: z.enum(["layer", "topic", "place", "feature", "insight"]),
          object_label: z.string(),
        }),
        execute: async ({
          subject_type,
          subject_label,
          relation,
          object_type,
          object_label,
        }) => {
          if (!userId) return { success: false, reason: "no user" };
          const from = await ensureNode(subject_type, subject_label);
          const to = await ensureNode(object_type, object_label);
          if (from && to) {
            await ensureEdge(from, to, relation);
            actions.push({
              type: "record_kg",
              from: subject_label,
              to: object_label,
              relation,
            });
            return { success: true };
          }
          return { success: false };
        },
      }),

      query_knowledge_graph: tool({
        description:
          "Query the user's existing knowledge graph. Returns nodes and relationships they have already recorded.",
        inputSchema: z.object({
          filter_type: z
            .string()
            .describe("Node type to filter, or empty string for all"),
        }),
        execute: async ({ filter_type }) => {
          if (!userId) return { nodes: [], edges: [] };
          let nodesQ = supabase
            .from("kg_nodes")
            .select("id,node_type,label,properties")
            .eq("user_id", userId)
            .limit(50);
          if (filter_type)
            nodesQ = nodesQ.eq("node_type", filter_type);
          const { data: nodes } = await nodesQ;
          const { data: edges } = await supabase
            .from("kg_edges")
            .select("from_node_id,to_node_id,relation")
            .eq("user_id", userId)
            .limit(100);
          return { nodes: nodes ?? [], edges: edges ?? [] };
        },
      }),
    };

    const systemPrompt = `You are the map assistant for GeoExplorer, an AI-powered geospatial application. You help users explore geospatial data on an interactive ArcGIS map.

Current map state:
- Visible layers: ${JSON.stringify(visibleLayers, null, 2)}
- Extent: ${JSON.stringify(mapExtent)}

Guidelines:
- When the user asks about data on the map, USE the tools to query real data — do not guess counts or attributes.
- When they ask to find something new, use search_arcgis_hub and then add_layer_to_map.
- When they ask to zoom/navigate, use fly_to_location.
- Every meaningful discovery should also be recorded in the knowledge graph via record_relationship so future queries can build on it.
- Be concise. Format responses with brief markdown when helpful.`;

    const result = await generateText({
      model,
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(50),
    });

    return new Response(
      JSON.stringify({
        text: result.text,
        actions,
        toolCallCount: result.steps.reduce(
          (n: number, s: any) => n + (s.toolCalls?.length ?? 0),
          0
        ),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("map-agent error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

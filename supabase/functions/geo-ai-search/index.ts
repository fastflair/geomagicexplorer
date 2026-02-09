import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function searchArcGISHub(query: string): Promise<any[]> {
  const searchUrl = new URL("https://www.arcgis.com/sharing/rest/search");
  searchUrl.searchParams.set("q", `${query} type:("Feature Service" OR "Map Service" OR "Image Service" OR "KML" OR "WMS" OR "WFS" OR "GeoJSON")`);
  searchUrl.searchParams.set("num", "10");
  searchUrl.searchParams.set("sortField", "numViews");
  searchUrl.searchParams.set("sortOrder", "desc");
  searchUrl.searchParams.set("f", "json");

  const res = await fetch(searchUrl.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

function mapItemToLayer(item: any): { url: string; title: string; type: string } | null {
  const t = (item.type || "").toLowerCase();
  let url = item.url;
  if (!url) return null;

  if (t.includes("feature service")) {
    if (!url.includes("/FeatureServer")) url += "/FeatureServer";
    url += "/0";
    return { url, title: item.title, type: "feature" };
  }
  if (t.includes("map service")) {
    if (!url.includes("/MapServer")) url += "/MapServer";
    return { url, title: item.title, type: "map-image" };
  }
  if (t.includes("image service")) {
    return { url, title: item.title, type: "imagery-tile" };
  }
  if (t.includes("kml")) return { url, title: item.title, type: "kml" };
  if (t.includes("wms")) return { url, title: item.title, type: "wms" };
  if (t.includes("wfs")) return { url, title: item.title, type: "wfs" };
  if (t.includes("geojson")) return { url, title: item.title, type: "geojson" };
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) throw new Error("Missing query");

    // Step 1: Search ArcGIS Hub for real layers
    console.log("Searching ArcGIS Hub for:", query);
    const hubResults = await searchArcGISHub(query);
    console.log(`Found ${hubResults.length} results from ArcGIS Hub`);

    if (hubResults.length === 0) {
      return new Response(JSON.stringify({ layers: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map results to layer configs
    const candidates = hubResults
      .map(mapItemToLayer)
      .filter(Boolean)
      .slice(0, 6);

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ layers: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Use AI to pick the best 1-3 and assign colors
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a geospatial data assistant. The user searched for "${query}". Here are REAL, verified layers found from ArcGIS Hub:

${JSON.stringify(candidates, null, 2)}

Pick the 1-3 most relevant layers for the user's query. Assign each a distinctive hex color. Return them using the suggest_layers tool. Only return layers from the list above — do NOT modify URLs.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Pick the best layers for: ${query}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_layers",
                description: "Return the best matching layers with colors",
                parameters: {
                  type: "object",
                  properties: {
                    layers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          url: { type: "string" },
                          title: { type: "string" },
                          color: { type: "string", description: "Hex color" },
                          type: {
                            type: "string",
                            enum: ["feature", "kml", "geojson", "csv", "wms", "wfs", "map-image", "ogc-feature", "imagery-tile"],
                          },
                        },
                        required: ["url", "title", "color", "type"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["layers"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_layers" } },
        }),
      }
    );

    if (!response.ok) {
      // Fallback: return top 3 candidates with default colors if AI fails
      const fallbackColors = ["#e74c3c", "#3498db", "#2ecc71"];
      const fallback = candidates.slice(0, 3).map((c: any, i: number) => ({
        ...c,
        color: fallbackColors[i],
      }));
      return new Response(JSON.stringify({ layers: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      const fallbackColors = ["#e74c3c", "#3498db", "#2ecc71"];
      const fallback = candidates.slice(0, 3).map((c: any, i: number) => ({
        ...c,
        color: fallbackColors[i],
      }));
      return new Response(JSON.stringify({ layers: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ layers: parsed.layers || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("geo-ai-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

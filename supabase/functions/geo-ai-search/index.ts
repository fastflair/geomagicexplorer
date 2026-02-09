import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) throw new Error("Missing query");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a geospatial data expert. The user wants to find public geospatial data layers.

Your job: Given the user's natural language query, return a JSON array of matching public geospatial data URLs.

CRITICAL: Only return URLs you are CERTAIN exist. Do NOT guess or fabricate URLs. If you are not 100% sure a service URL is real and publicly accessible, do NOT include it. It is better to return fewer results than to return broken URLs.

VERIFIED WORKING SOURCES (prefer these):
- https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/ (Esri Living Atlas — many verified layers)
- https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/ (Esri open data)
- https://sampleserver6.arcgisonline.com/arcgis/rest/services/ (Esri sample server)
- https://earthquake.usgs.gov/earthquakes/feed/ (USGS earthquake feeds — GeoJSON/KML)
- https://nowcoast.noaa.gov/arcgis/rest/services/ (NOAA weather — MapServer)
- https://services.arcgisonline.com/arcgis/rest/services/ (Esri basemap services)

SUPPORTED FORMATS:
1. "feature" — ArcGIS FeatureServer (e.g. .../FeatureServer/0)
2. "kml" — KML or KMZ files
3. "geojson" — GeoJSON files (.geojson or .json)
4. "csv" — CSV files with lat/lon columns
5. "wms" — OGC WMS endpoints
6. "wfs" — OGC WFS endpoints
7. "map-image" — ArcGIS MapServer (e.g. .../MapServer)
8. "ogc-feature" — OGC API Features
9. "imagery-tile" — ArcGIS ImageServer

RULES:
- Do NOT invent service names. Only use service names you have seen before.
- If unsure whether a specific service exists under a domain, return an empty array instead.
- Return 1-3 layers maximum.
- Pick a distinctive hex color for each layer.

You must respond using the suggest_layers tool.`;

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
            { role: "user", content: query },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_layers",
                description:
                  "Return matching public geospatial layer URLs in any supported format",
                parameters: {
                  type: "object",
                  properties: {
                    layers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          url: {
                            type: "string",
                            description:
                              "Full public URL to the geospatial data",
                          },
                          title: {
                            type: "string",
                            description: "Human-readable layer name",
                          },
                          color: {
                            type: "string",
                            description: "Hex color for the layer",
                          },
                          type: {
                            type: "string",
                            enum: ["feature", "kml", "geojson", "csv", "wms", "wfs", "map-image", "ogc-feature", "imagery-tile"],
                            description: "Layer format type",
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
          tool_choice: {
            type: "function",
            function: { name: "suggest_layers" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ layers: [] }), {
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

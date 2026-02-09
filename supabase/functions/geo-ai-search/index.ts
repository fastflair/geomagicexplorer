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

IMPORTANT RULES:
- Return REAL, publicly accessible URLs only. Supported formats:
  1. "feature" — ArcGIS FeatureServer URLs (ending in /FeatureServer/0 or similar)
  2. "kml" — KML or KMZ files (.kml / .kmz URLs hosted publicly)
  3. "geojson" — GeoJSON files (.geojson or .json URLs)
  4. "csv" — CSV files with lat/lon columns (.csv URLs)
  5. "wms" — OGC WMS services (Web Map Service endpoints)
  6. "wfs" — OGC WFS services (Web Feature Service endpoints)
  7. "map-image" — ArcGIS MapServer URLs (dynamic map services)
  8. "ogc-feature" — OGC API Features endpoints
  9. "imagery-tile" — ArcGIS ImageServer URLs (raster/imagery services)
- Use well-known public data sources like:
  - services9.arcgis.com/RHVPKKiFTONKtxq3 (Living Atlas)
  - services1.arcgis.com/Hp6G80Pky0om7QvQ (Esri open data)
  - services.arcgis.com (various public services)
  - sampleserver6.arcgisonline.com
  - earthquake.usgs.gov (USGS data — KML/GeoJSON/CSV feeds)
  - data.gov, hub.arcgis.com, and other open data portals
  - NASA, NOAA, USGS public WMS/WFS services
  - nowcoast.noaa.gov, mesonet.agron.iastate.edu (weather WMS)
- Prefer ArcGIS FeatureServer when available, but use other formats when they better match the query
- If you're not confident a URL exists, don't include it
- Return 1-3 layers maximum
- Pick a distinctive hex color for each layer

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

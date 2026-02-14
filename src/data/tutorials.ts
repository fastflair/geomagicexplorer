import type { Tutorial } from "@/components/TutorialCard";

/* ------------------------------------------------------------------ */
/*  TRACK 1 — Leaders & Strategists                                   */
/* ------------------------------------------------------------------ */

export const leaderTutorials: Tutorial[] = [
  {
    id: "l1",
    title: "What is Geospatial Data?",
    readingTime: "8 min",
    difficulty: "Beginner",
    content: `
## Understanding the Language of Location

Every event, asset, and decision in an organisation has a **where**. Geospatial data encodes that "where" so machines can reason about it.

### Core Concepts

| Term | Meaning |
|------|---------|
| **Coordinate System** | A mathematical framework (e.g. WGS 84) that maps real-world locations to numbers |
| **Projection** | A method to flatten the 3-D Earth onto a 2-D screen — every projection distorts *something* |
| **Feature** | A discrete geographic object: a point (sensor), line (road), or polygon (building footprint) |
| **Raster** | A grid of cells (pixels), used for satellite imagery, elevation models, and heatmaps |
| **Spatial Index** | A data structure (R-tree, GeoHash) that makes "find everything within 5 km" fast |

### Coordinate Reference Systems (CRS)

\`\`\`
WGS 84  (EPSG:4326) — GPS coordinates, latitude / longitude in degrees
Web Mercator (EPSG:3857) — Used by most web maps, metres from origin
UTM Zones — High-precision local grids (e.g. engineering, surveying)
\`\`\`

The most common mistake is **mixing CRS** — always check that your datasets share the same spatial reference before overlaying them.

### Why It Matters for Leaders

1. **Data integration** — merging sales, weather, and foot-traffic data only works when locations align.
2. **Regulatory compliance** — many jurisdictions require geo-fencing for privacy (GDPR) or safety (FAA drone zones).
3. **Strategic insight** — patterns that are invisible in spreadsheets become obvious on a map.
`,
    takeaways: [
      "Geospatial data represents the 'where' of any event or asset.",
      "Coordinate Reference Systems must match before combining datasets.",
      "Projections always involve trade-offs — choose based on your use case.",
      "Spatial indexes are what make real-time map interactions possible.",
    ],
  },
  {
    id: "l2",
    title: "The Business Value of Location Intelligence",
    readingTime: "10 min",
    difficulty: "Beginner",
    content: `
## Turning Location into Competitive Advantage

Location intelligence (LI) transforms raw geographic data into actionable business insights.

### Industry Use Cases

#### 🚚 Logistics & Supply Chain
- **Route optimisation** — reduce fuel costs 8-15 % by considering real-time traffic, weather, and road closures.
- **Last-mile analytics** — identify delivery zones with highest failure rates.
- **Warehouse placement** — model demand surfaces to find optimal facility locations.

#### 🏠 Real Estate & Urban Planning
- **Site selection** — overlay demographics, transit access, and competitor proximity.
- **Property valuation** — spatial regression models outperform simple comps by 20 %+ in heterogeneous markets.
- **Urban growth modelling** — forecast where development pressure will appear.

#### 🛡️ Insurance & Risk
- **Catastrophe modelling** — combine flood zones, wind fields, and building exposure.
- **Fraud detection** — flag claims whose GPS metadata contradicts reported location.
- **Micro-rating** — price policies at the parcel level instead of ZIP code.

#### 🛒 Retail & Marketing
- **Trade area analysis** — understand true customer catchment vs. assumed radius.
- **Geo-targeted campaigns** — serve mobile ads within 200 m of a store.
- **Cannibalisation studies** — predict revenue impact before opening a new location.

### ROI Framework

\`\`\`
ROI = (ΔRevenue + ΔCost Savings) / Investment in LI Platform

Typical ranges:
  - Fleet optimisation:    3-8× in year one
  - Site selection:        5-15× over facility lifetime
  - Risk pricing:          2-4× via reduced loss ratios
\`\`\`

### Getting Started

1. **Audit your data** — what already has a location field? (address, IP, GPS, store ID)
2. **Geocode everything** — convert addresses to coordinates using a geocoding API.
3. **Visualise first** — plot your data on a map before building models; you'll spot data-quality issues immediately.
4. **Start small** — one high-value use case, proven ROI, then expand.
`,
    takeaways: [
      "Nearly every industry can extract value from location intelligence.",
      "Start by auditing which of your existing datasets already contain location fields.",
      "Visualise data on a map early to catch quality issues.",
      "ROI is typically strongest in logistics, risk, and site selection use cases.",
    ],
  },
  {
    id: "l3",
    title: "AI Agents in Geospatial: A Strategic Overview",
    readingTime: "12 min",
    difficulty: "Intermediate",
    content: `
## What AI Agents Can Do with Maps

An **AI agent** is software that perceives its environment, reasons about goals, and takes autonomous actions. In the geospatial domain, agents can:

- **Discover** datasets by interpreting natural-language queries ("find flood risk layers for Texas").
- **Transform** raw data — re-project, clip, join — without manual GIS steps.
- **Analyse** patterns — clustering, anomaly detection, change detection — at scale.
- **Present** findings — generate maps, charts, and narrative summaries automatically.

### How This App Uses AI Agents

GeoExplorer's **AI Search** feature is a concrete example. When you type a query like *"show me earthquake data near California"*, the system:

1. Sends your query to an edge function.
2. The edge function calls an LLM to interpret intent and extract keywords.
3. It searches the ArcGIS Online catalog via REST API.
4. Results are filtered, ranked, and the best layer is added to the map — all in seconds.

\`\`\`
User query → LLM intent parsing → ArcGIS catalog search → Layer added to map
\`\`\`

### Strategic Implications

| Capability | Before AI Agents | With AI Agents |
|-----------|-----------------|----------------|
| Data discovery | Manual portal browsing, hours | Natural language, seconds |
| Report generation | Analyst creates in GIS software | Agent generates on demand |
| Monitoring | Periodic manual checks | Continuous, event-driven alerts |
| Prototyping | Weeks of development | Hours with agent-assisted code |

### Building an AI-Agent Strategy

1. **Identify repetitive GIS workflows** — these are prime candidates for agent automation.
2. **Invest in data cataloguing** — agents are only as good as the metadata they can search.
3. **Set guardrails** — define which actions agents can take autonomously vs. requiring human approval.
4. **Measure** — track time saved, data freshness, and decision quality.
`,
    takeaways: [
      "AI agents automate the discover → transform → analyse → present pipeline.",
      "GeoExplorer's AI Search is a working example of an agent-driven workflow.",
      "Start by automating repetitive GIS tasks — data discovery, report generation, monitoring.",
      "Guardrails are essential: define what agents can do autonomously.",
    ],
  },
  {
    id: "l4",
    title: "Building a Geospatial Product Roadmap",
    readingTime: "10 min",
    difficulty: "Advanced",
    content: `
## From Idea to Location-Aware Product

### Phase 1: Foundation (Month 1-2)
- Choose a base map provider (ArcGIS, Mapbox, Google Maps, OpenStreetMap).
- Stand up a spatial database (PostGIS, ArcGIS Online, BigQuery GIS).
- Implement authentication & basic map rendering.
- Deploy a proof-of-concept with one data layer.

### Phase 2: Core Features (Month 3-4)
- Add layer management — toggling, filtering, symbology.
- Implement spatial queries — "show features within this polygon."
- Build search — full-text and spatial (bounding box / radius).
- Add bookmarks, share links, and basic export (PNG, GeoJSON).

### Phase 3: Intelligence Layer (Month 5-6)
- Integrate an AI agent for natural-language data discovery.
- Add automated analytics — clustering, heatmaps, change detection.
- Build dashboards that combine maps with charts.
- Implement real-time data feeds (IoT sensors, social media).

### Phase 4: Scale & Differentiate (Month 7+)
- Optimise tile rendering and vector tile pipelines.
- Add collaborative features — shared annotations, team workspaces.
- Build domain-specific workflows (e.g., insurance inspection, field survey).
- Explore AR/VR integration and 3-D visualisation.

### Key Metrics to Track

\`\`\`
Engagement:    Layers added per session, queries per user
Performance:   Map load time (< 2 s), query response time (< 500 ms)
Business:      Decisions influenced, time-to-insight reduction
AI Agent:      Query success rate, layers-added-via-AI ratio
\`\`\`

### Common Pitfalls

- **Over-engineering projections** — start with Web Mercator; add local CRS only when precision demands it.
- **Ignoring mobile** — responsive maps are hard; plan for touch interactions from day one.
- **Data hoarding** — don't ingest everything; curate layers that drive decisions.
- **Skipping accessibility** — screen readers can't read maps; provide data tables as alternatives.
`,
    takeaways: [
      "Phased delivery reduces risk: foundation → features → intelligence → scale.",
      "Track engagement and performance metrics from day one.",
      "AI agents fit best in Phase 3 after core map features are solid.",
      "Don't forget mobile, accessibility, and data curation.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  TRACK 2 — Analysts & GIS Professionals                            */
/* ------------------------------------------------------------------ */

export const analystTutorials: Tutorial[] = [
  {
    id: "a1",
    title: "Working with ArcGIS Feature Services",
    readingTime: "12 min",
    difficulty: "Intermediate",
    content: `
## Querying Feature Services via REST

Every ArcGIS Feature Service exposes a REST API you can query directly from a browser or code.

### Base URL Pattern

\`\`\`
https://<host>/arcgis/rest/services/<ServiceName>/FeatureServer/<layerIndex>
\`\`\`

### Example: Query Recent Earthquakes

\`\`\`typescript
const url = new URL(
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USGS_Seismic_Data_v1/FeatureServer/0/query"
);

url.searchParams.set("where", "mag > 4.0");
url.searchParams.set("outFields", "mag,place,time,depth");
url.searchParams.set("returnGeometry", "true");
url.searchParams.set("f", "json");
url.searchParams.set("resultRecordCount", "50");

const response = await fetch(url.toString());
const data = await response.json();

console.log(\`Found \${data.features.length} earthquakes\`);
data.features.forEach((f: any) => {
  console.log(\`M\${f.attributes.mag} — \${f.attributes.place}\`);
});
\`\`\`

### Spatial Queries

You can filter by geometry using \`geometry\`, \`geometryType\`, and \`spatialRel\` parameters:

\`\`\`typescript
// Find earthquakes within a bounding box
url.searchParams.set("geometry", JSON.stringify({
  xmin: -125, ymin: 32, xmax: -114, ymax: 42,
  spatialReference: { wkid: 4326 }
}));
url.searchParams.set("geometryType", "esriGeometryEnvelope");
url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
\`\`\`

### Common Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| \`where\` | SQL-like filter | \`mag > 3 AND place LIKE '%California%'\` |
| \`outFields\` | Fields to return | \`mag,place,time\` or \`*\` |
| \`returnGeometry\` | Include shapes | \`true\` / \`false\` |
| \`resultRecordCount\` | Limit results | \`100\` |
| \`orderByFields\` | Sort | \`mag DESC\` |
| \`outSR\` | Output spatial ref | \`4326\` |

### Pagination

Feature services cap results (often 1000-2000). Use \`resultOffset\` and \`resultRecordCount\` to page:

\`\`\`typescript
let offset = 0;
const pageSize = 1000;
let allFeatures: any[] = [];

while (true) {
  url.searchParams.set("resultOffset", String(offset));
  url.searchParams.set("resultRecordCount", String(pageSize));
  const res = await fetch(url.toString());
  const page = await res.json();
  allFeatures.push(...page.features);
  if (!page.exceededTransferLimit) break;
  offset += pageSize;
}
\`\`\`
`,
    takeaways: [
      "Feature Services expose a powerful REST API — no SDK required.",
      "Use `where` for attribute filters and `geometry` for spatial filters.",
      "Always paginate — services cap result counts.",
      "Set `outFields` explicitly to reduce payload size.",
    ],
  },
  {
    id: "a2",
    title: "Spatial Analysis Patterns",
    readingTime: "10 min",
    difficulty: "Intermediate",
    content: `
## Common Spatial Analysis Techniques

### 1. Buffering

Create a zone around a feature — e.g., "show everything within 5 km of this power plant."

\`\`\`typescript
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";

const plant = new Point({
  longitude: -118.25, latitude: 34.05,
  spatialReference: { wkid: 4326 }
});

// Buffer by 5 km (geodesic for accuracy on curved Earth)
const buffer = geometryEngine.geodesicBuffer(plant, 5, "kilometers");
console.log("Buffer area:", geometryEngine.geodesicArea(buffer, "square-kilometers"), "km²");
\`\`\`

### 2. Overlay / Intersection

Find where two layers overlap — e.g., "which flood zones intersect my building footprints?"

\`\`\`typescript
const intersection = geometryEngine.intersect(floodZone, buildingFootprint);
if (intersection) {
  console.log("This building is in a flood zone!");
}
\`\`\`

### 3. Proximity / Nearest

Find the closest feature — e.g., "which fire station is closest to this wildfire?"

\`\`\`typescript
const distances = fireStations.map(station => ({
  station,
  distance: geometryEngine.geodesicLength(
    geometryEngine.geodesicDensify(
      new Polyline({ paths: [[
        [wildfire.longitude, wildfire.latitude],
        [station.longitude, station.latitude]
      ]] }),
      1000, "meters"
    ),
    "kilometers"
  )
}));

distances.sort((a, b) => a.distance - b.distance);
console.log("Nearest station:", distances[0].station.name, distances[0].distance, "km");
\`\`\`

### 4. Convex Hull & Clustering

Group nearby features and draw a boundary:

\`\`\`typescript
const points = earthquakes.map(eq => eq.geometry);
const hull = geometryEngine.convexHull(points);
// hull is a Polygon encompassing all earthquake points
\`\`\`

### Choosing the Right Analysis

| Question | Technique |
|----------|-----------|
| "What's within X distance?" | Buffer + spatial query |
| "Where do A and B overlap?" | Intersect / Union |
| "What's closest?" | Nearest / Distance matrix |
| "Where are the clusters?" | DBSCAN / K-means on coords |
| "What changed between dates?" | Temporal diff + overlay |
`,
    takeaways: [
      "Buffering, overlay, and proximity are the three fundamental spatial operations.",
      "Use geodesic methods for accuracy on real-world (curved) distances.",
      "ArcGIS JS SDK's geometryEngine performs these client-side — no server needed.",
      "Combine techniques: buffer + intersect = 'what facilities are within 5 km of the flood zone?'",
    ],
  },
  {
    id: "a3",
    title: "Using AI Agents to Automate Data Discovery",
    readingTime: "12 min",
    difficulty: "Advanced",
    content: `
## How GeoExplorer's AI Search Works

This application includes an AI-powered search that converts natural language into geospatial layer results. Here's exactly how it works under the hood.

### Architecture

\`\`\`
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│  User types  │────▶│ Edge Function │────▶│ LLM (Gemini)      │
│  "flood data │     │ geo-ai-search│     │ Extracts keywords │
│   in Texas"  │     └──────┬───────┘     └───────────────────┘
└──────────────┘            │
                            ▼
                   ┌────────────────┐     ┌──────────────────┐
                   │ ArcGIS Online  │────▶│ Ranked results    │
                   │ Catalog Search │     │ returned to UI    │
                   └────────────────┘     └──────────────────┘
\`\`\`

### The Edge Function (Simplified)

\`\`\`typescript
// supabase/functions/geo-ai-search/index.ts

import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { query } = await req.json();

  // Step 1: Ask the LLM to extract search keywords
  const llmResponse = await fetch("https://api.example.com/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer ..." },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [{
        role: "user",
        content: \`Extract 2-4 search keywords from this geospatial query.
                  Return ONLY a JSON array of strings.
                  Query: "\${query}"\`
      }]
    })
  });

  const keywords = JSON.parse((await llmResponse.json()).choices[0].message.content);

  // Step 2: Search the ArcGIS Online catalog
  const searchUrl = new URL("https://www.arcgis.com/sharing/rest/search");
  searchUrl.searchParams.set("q", keywords.join(" ") + " type:Feature Service");
  searchUrl.searchParams.set("f", "json");
  searchUrl.searchParams.set("num", "5");

  const catalogRes = await fetch(searchUrl.toString());
  const catalog = await catalogRes.json();

  // Step 3: Return the best match
  const best = catalog.results[0];
  return new Response(JSON.stringify({
    url: best.url,
    title: best.title,
    snippet: best.snippet,
  }));
});
\`\`\`

### Key Design Decisions

1. **Keyword extraction over direct search** — LLMs understand synonyms and context ("flood" → "inundation", "floodplain", "FEMA flood zones").
2. **Server-side only** — the LLM call happens in an edge function so API keys stay secret.
3. **Catalog-first** — we search existing public data rather than generating synthetic data.
4. **Graceful fallback** — if the LLM fails, we fall back to the raw query as search terms.

### Extending the Agent

You can make the agent smarter by:
- Adding **spatial context** — pass the current map extent so results are location-relevant.
- Implementing **multi-step reasoning** — first find data, then apply a filter, then generate a summary.
- Adding **memory** — track previous queries so "now show me the same for Florida" works.
`,
    takeaways: [
      "AI agents bridge the gap between human intent and structured API queries.",
      "Keyword extraction via LLM handles synonyms and ambiguity.",
      "Always keep LLM calls server-side to protect API keys.",
      "Agent capabilities can be extended with spatial context, multi-step reasoning, and memory.",
    ],
  },
  {
    id: "a4",
    title: "Building Dashboards from Geospatial Data",
    readingTime: "10 min",
    difficulty: "Advanced",
    content: `
## Combining Maps with Charts

The most powerful geospatial dashboards pair an interactive map with synchronized charts. Here's how to build one using React, ArcGIS, and Recharts (all used in this app).

### Pattern: Map Selection → Chart Update

\`\`\`typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useState } from "react";

interface EarthquakeStats {
  range: string;
  count: number;
}

function EarthquakeDashboard() {
  const [stats, setStats] = useState<EarthquakeStats[]>([]);

  // Called when the map extent changes or user selects features
  const handleMapUpdate = (features: any[]) => {
    const ranges = [
      { range: "0-2", min: 0, max: 2 },
      { range: "2-4", min: 2, max: 4 },
      { range: "4-6", min: 4, max: 6 },
      { range: "6+",  min: 6, max: 99 },
    ];

    setStats(ranges.map(r => ({
      range: r.range,
      count: features.filter(f =>
        f.attributes.mag >= r.min && f.attributes.mag < r.max
      ).length,
    })));
  };

  return (
    <div className="flex gap-4">
      {/* Map component would go here, calling handleMapUpdate */}
      <div className="w-80">
        <h3>Earthquake Magnitude Distribution</h3>
        <BarChart width={300} height={200} data={stats}>
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(0, 75%, 58%)" />
        </BarChart>
      </div>
    </div>
  );
}
\`\`\`

### Pattern: Chart Click → Map Highlight

\`\`\`typescript
const handleBarClick = (data: any) => {
  // Apply a definition expression to filter the map layer
  const [min, max] = data.range === "6+"
    ? [6, 99]
    : data.range.split("-").map(Number);

  mapView.current?.applyFilter(
    "earthquakes",
    \`mag >= \${min} AND mag < \${max}\`
  );
};

<Bar dataKey="count" fill="hsl(0, 75%, 58%)" onClick={handleBarClick} />
\`\`\`

### Dashboard Layout Tips

1. **Map takes priority** — give it at least 60 % of the viewport.
2. **Sync on extent change** — re-query features when the user pans/zooms.
3. **Use consistent colours** — the chart colour for "earthquakes" should match the map symbology.
4. **Keep charts simple** — bar, pie, and line charts are easier to interpret than complex visualisations.
5. **Add a time slider** — temporal data becomes dramatically more useful with animation.
`,
    takeaways: [
      "The map-chart sync pattern is the foundation of geospatial dashboards.",
      "Use consistent colours between map symbology and chart series.",
      "Re-query data on extent change to keep charts relevant to the visible area.",
      "Recharts integrates naturally with React state for bidirectional interactivity.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  TRACK 3 — Developers & Engineers                                   */
/* ------------------------------------------------------------------ */

export const developerTutorials: Tutorial[] = [
  {
    id: "d1",
    title: "ArcGIS JS SDK Quickstart",
    readingTime: "15 min",
    difficulty: "Beginner",
    content: `
## Creating Your First Map in React

### Installation

\`\`\`bash
npm install @arcgis/core
\`\`\`

Add the CSS to your \`index.css\`:

\`\`\`css
@import "https://js.arcgis.com/4.31/@arcgis/core/assets/esri/themes/dark/main.css";
\`\`\`

### Basic MapView Component

\`\`\`typescript
import { useEffect, useRef } from "react";
import ArcGISMap from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";

export default function SimpleMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new ArcGISMap({
      basemap: "dark-gray-vector",
    });

    const view = new MapView({
      container: containerRef.current,
      map,
      center: [-98.5, 39.8], // Center of US
      zoom: 4,
    });

    return () => {
      view.destroy();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
\`\`\`

### Adding a Feature Layer

\`\`\`typescript
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// Inside your useEffect, after creating the map:
const earthquakeLayer = new FeatureLayer({
  url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USGS_Seismic_Data_v1/FeatureServer/0",
  title: "Recent Earthquakes",
  renderer: {
    type: "simple",
    symbol: {
      type: "simple-marker",
      color: [255, 80, 80, 0.8],
      size: 6,
      outline: { color: [255, 255, 255, 0.3], width: 0.5 },
    },
  } as any,
});

map.add(earthquakeLayer);
\`\`\`

### Handling Click Events

\`\`\`typescript
view.on("click", async (event) => {
  const response = await view.hitTest(event);
  const results = response.results.filter(
    (r) => r.type === "graphic"
  );

  if (results.length > 0) {
    const feature = results[0].graphic;
    console.log("Clicked:", feature.attributes);

    // Zoom to the feature
    view.goTo({
      target: feature.geometry,
      zoom: 10,
    });
  }
});
\`\`\`

### Key Concepts

- **Map** holds data layers (the "model").
- **MapView** renders the map to a DOM element (the "view") — 2D. Use **SceneView** for 3D.
- **Layers** are added to the Map, not the View.
- Always call \`view.destroy()\` in your cleanup function to avoid memory leaks.
`,
    takeaways: [
      "Map = data model, MapView = 2D renderer, SceneView = 3D renderer.",
      "Always destroy the view in React's cleanup function.",
      "FeatureLayer connects to ArcGIS REST services with built-in query support.",
      "hitTest() is the primary way to handle click interactions on the map.",
    ],
  },
  {
    id: "d2",
    title: "Building Custom Map Components in React",
    readingTime: "15 min",
    difficulty: "Intermediate",
    content: `
## Patterns from This Application

This app (GeoExplorer) uses several patterns worth studying. Here's how the MapView component is structured.

### Pattern: forwardRef + useImperativeHandle

The MapView component exposes methods to its parent via \`useImperativeHandle\`:

\`\`\`typescript
import { forwardRef, useImperativeHandle, useRef } from "react";
import ArcGISMap from "@arcgis/core/Map";
import MapViewArcGIS from "@arcgis/core/views/MapView";

export interface MapViewHandle {
  getMapState: () => { center: number[]; zoom: number } | null;
  flyTo: (x: number, y: number, zoom: number) => void;
  exportImage: () => Promise<void>;
  applyFilter: (layerId: string, where: string | null) => void;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>((props, ref) => {
  const viewRef = useRef<MapViewArcGIS | null>(null);

  useImperativeHandle(ref, () => ({
    getMapState() {
      const v = viewRef.current;
      if (!v) return null;
      return {
        center: [v.center.longitude, v.center.latitude],
        zoom: v.zoom,
      };
    },
    flyTo(x, y, zoom) {
      viewRef.current?.goTo(
        { target: [x, y], zoom },
        { duration: 1500, easing: "ease-in-out" }
      );
    },
    async exportImage() {
      const screenshot = await viewRef.current?.takeScreenshot({ format: "png" });
      if (screenshot) {
        const a = document.createElement("a");
        a.href = screenshot.dataUrl;
        a.download = "map-export.png";
        a.click();
      }
    },
    applyFilter(layerId, where) {
      const layer = viewRef.current?.map.findLayerById(layerId);
      if (layer && layer.type === "feature") {
        (layer as any).definitionExpression = where || "1=1";
      }
    },
  }));

  // ... render logic
});
\`\`\`

### Pattern: Dynamic Layer Management

Layers are managed in parent state and synced to the map:

\`\`\`typescript
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  // Add new layers
  layers.forEach((layerDef) => {
    if (!map.findLayerById(layerDef.id)) {
      const fl = new FeatureLayer({
        id: layerDef.id,
        url: layerDef.url,
        title: layerDef.title,
        visible: layerDef.visible,
      });
      map.add(fl);
    }
  });

  // Remove deleted layers
  const layerIds = new Set(layers.map(l => l.id));
  map.layers.forEach((ml) => {
    if (!layerIds.has(ml.id)) {
      map.remove(ml);
    }
  });
}, [layers]);
\`\`\`

### Pattern: Feature Detail Panel

When a user clicks a feature, display its attributes in a side panel:

\`\`\`typescript
const [selectedFeature, setSelectedFeature] = useState<any>(null);

view.on("click", async (event) => {
  const hit = await view.hitTest(event);
  const graphic = hit.results.find(r => r.type === "graphic")?.graphic;

  if (graphic) {
    setSelectedFeature({
      layerTitle: graphic.layer.title,
      attributes: graphic.attributes,
      geometry: graphic.geometry,
    });
  } else {
    setSelectedFeature(null);
  }
});
\`\`\`
`,
    takeaways: [
      "useImperativeHandle lets parent components control the map without lifting all state up.",
      "Sync layers declaratively: React state is the source of truth, map is the render target.",
      "hitTest + state is the pattern for feature selection and detail panels.",
      "Always clean up ArcGIS resources in useEffect return functions.",
    ],
  },
  {
    id: "d3",
    title: "Integrating AI Agents for Geospatial Search",
    readingTime: "18 min",
    difficulty: "Advanced",
    content: `
## Building the geo-ai-search Edge Function

This tutorial walks through the actual edge function used in GeoExplorer to power AI-driven layer discovery.

### Complete Edge Function

\`\`\`typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) throw new Error("Missing query");

    // Step 1: Use LLM to extract search keywords
    const systemPrompt = \`You are a geospatial data assistant.
    Given a user query, extract 2-4 search keywords that would find
    relevant ArcGIS Feature Services. Return ONLY a JSON array of strings.
    Example: ["earthquake", "seismic", "USGS"]\`;

    const llmRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${Deno.env.get("LOVABLE_API_KEY")}\`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      }),
    });

    const llmData = await llmRes.json();
    let keywords: string[];

    try {
      keywords = JSON.parse(llmData.choices[0].message.content);
    } catch {
      // Fallback: use the raw query
      keywords = query.split(/\\s+/).slice(0, 4);
    }

    // Step 2: Search ArcGIS Online
    const searchQuery = keywords.join(" ") + " type:Feature Service";
    const searchUrl = \`https://www.arcgis.com/sharing/rest/search?q=\${
      encodeURIComponent(searchQuery)
    }&f=json&num=5&sortField=numviews&sortOrder=desc\`;

    const catalogRes = await fetch(searchUrl);
    const catalog = await catalogRes.json();

    if (!catalog.results?.length) {
      return new Response(
        JSON.stringify({ error: "No layers found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Step 3: Return the top result
    const best = catalog.results[0];
    return new Response(
      JSON.stringify({
        url: best.url + "/0",
        title: best.title,
        snippet: best.snippet,
        keywords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
\`\`\`

### Calling from the Frontend

\`\`\`typescript
import { supabase } from "@/integrations/supabase/client";

async function searchForLayer(query: string) {
  const { data, error } = await supabase.functions.invoke("geo-ai-search", {
    body: { query },
  });

  if (error) throw error;

  // data = { url, title, snippet, keywords }
  return data;
}

// Usage in a component:
const result = await searchForLayer("wildfire data in California");
console.log(result.title);  // e.g., "USA Wildfires v1"
console.log(result.url);    // Feature Service URL ready to add to the map
\`\`\`

### Making It Smarter

#### Add Spatial Context

\`\`\`typescript
// Pass the current map extent to the edge function
const mapExtent = mapRef.current?.getMapState();
const { data } = await supabase.functions.invoke("geo-ai-search", {
  body: {
    query,
    extent: mapExtent, // { center: [lng, lat], zoom }
  },
});
\`\`\`

#### Multi-Step Agent

\`\`\`typescript
// Agent loop: search → validate → refine
async function agentSearch(query: string, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    const result = await searchForLayer(query);

    // Validate the result has data
    const checkUrl = result.url + "/query?where=1=1&returnCountOnly=true&f=json";
    const countRes = await fetch(checkUrl);
    const count = (await countRes.json()).count;

    if (count > 0) return { ...result, featureCount: count };

    // Refine the query for next attempt
    query = query + " feature service with data";
  }
  throw new Error("Could not find a layer with data");
}
\`\`\`
`,
    takeaways: [
      "Edge functions keep API keys secure while enabling AI-powered search.",
      "LLM keyword extraction handles natural language better than raw text search.",
      "Always implement fallback logic when LLM parsing fails.",
      "Multi-step agents can validate and refine results automatically.",
    ],
  },
  {
    id: "d4",
    title: "Creating New Geospatial Products with AI",
    readingTime: "15 min",
    difficulty: "Advanced",
    content: `
## From Prompt to Product

AI agents can help you build geospatial products faster by automating data discovery, analysis, and presentation. Here's a framework for building AI-powered geo products.

### 1. Prompt Engineering for Geo Queries

Design prompts that produce structured, actionable output:

\`\`\`typescript
const SYSTEM_PROMPT = \`You are a geospatial product assistant.
When given a user requirement, produce a JSON plan with:
{
  "layers": [{ "name": string, "type": "feature"|"raster", "source": "arcgis"|"wms"|"geojson" }],
  "analyses": [{ "type": "buffer"|"intersect"|"cluster"|"heatmap", "params": {} }],
  "visualisation": { "type": "map"|"dashboard"|"report", "charts": string[] },
  "filters": [{ "field": string, "operator": string, "value": any }]
}
Only include what's needed. Be specific about data sources.\`;

async function planProduct(requirement: string) {
  const response = await fetch("/api/ai", {
    method: "POST",
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: requirement },
      ],
    }),
  });
  return response.json();
}

// Example:
const plan = await planProduct(
  "I need a dashboard showing flood risk for commercial properties in Houston"
);
// Returns structured plan with specific layers, analyses, and viz recommendations
\`\`\`

### 2. Building a Data Pipeline

\`\`\`typescript
interface GeoPipeline {
  ingest: (sources: string[]) => Promise<FeatureCollection>;
  transform: (data: FeatureCollection, operations: Operation[]) => FeatureCollection;
  analyse: (data: FeatureCollection, method: string) => AnalysisResult;
  present: (result: AnalysisResult, format: string) => void;
}

// Example pipeline for flood risk assessment:
async function floodRiskPipeline() {
  // 1. Ingest
  const floodZones = await fetchFeatureService(FEMA_FLOOD_URL);
  const buildings = await fetchFeatureService(BUILDING_FOOTPRINTS_URL);

  // 2. Transform — clip buildings to flood zones
  const atRisk = buildings.features.filter(building =>
    floodZones.features.some(zone =>
      geometryEngine.intersects(zone.geometry, building.geometry)
    )
  );

  // 3. Analyse — aggregate by risk level
  const riskSummary = atRisk.reduce((acc, b) => {
    const zone = b.attributes.flood_zone; // A, AE, X, etc.
    acc[zone] = (acc[zone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 4. Present — render as map + chart
  return { atRiskBuildings: atRisk, summary: riskSummary };
}
\`\`\`

### 3. Agent-Assisted Code Generation

Use AI to generate map configurations:

\`\`\`typescript
const CODE_GEN_PROMPT = \`Generate a React component that:
1. Creates an ArcGIS MapView
2. Adds the following layers: {layers}
3. Applies these filters: {filters}
4. Includes a legend and scale bar
Return ONLY the TypeScript code, no explanation.\`;

// The AI generates a complete, runnable component
// that you can review, test, and deploy
\`\`\`

### 4. Product Patterns

| Pattern | Description | AI Role |
|---------|-------------|---------|
| **Explorer** | Interactive map with search & filter | Data discovery agent |
| **Monitor** | Real-time dashboard with alerts | Anomaly detection agent |
| **Analyser** | Spatial analysis with reports | Analysis & summary agent |
| **Collector** | Field data collection app | Validation & enrichment agent |

### 5. Shipping Checklist

\`\`\`
□ Data sources identified and accessible
□ Spatial reference systems aligned
□ AI agent prompts tested with edge cases
□ Fallback behaviour for API failures
□ Performance tested with realistic data volumes
□ Mobile responsiveness verified
□ Accessibility — data tables alongside maps
□ Security — API keys in edge functions, RLS on user data
\`\`\`
`,
    takeaways: [
      "Structured prompts produce structured plans — design your AI output format carefully.",
      "The ingest → transform → analyse → present pipeline applies to every geo product.",
      "AI agents excel at data discovery and code generation; humans excel at validation and design.",
      "Always include fallback behaviour, performance testing, and accessibility in your shipping checklist.",
    ],
  },
];

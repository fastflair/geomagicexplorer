# AI + Geospatial + Knowledge Graph Enhancements

Below are the highest-impact features that demonstrate what AI agents can do with geospatial data — with a knowledge graph as the connective tissue linking places, layers, entities, and user queries.

## Top Recommendations

### 1. Conversational Map Agent ("Ask the Map")
A chat panel where the user asks natural-language questions like:
- *"Which of my visible layers overlap in California?"*
- *"Are there any wildfires within 100 km of a nuclear power plant?"*
- *"Summarize what's on my current map view."*

The agent uses **AI SDK tool calling** with tools such as `queryLayer`, `spatialIntersect`, `bufferPoint`, `getMapExtent`, `flyToLocation`, `addLayer`. Each tool executes real ArcGIS operations against layers already on the map. Results stream into chat with map highlights.

### 2. Geospatial Knowledge Graph
A persistent graph in the database that records **entities** (places, layers, features, users, queries) and their **relationships** (`located_in`, `related_to`, `derived_from`, `queried_by`, `overlaps_with`).

- When AI Search adds a layer, we create nodes for the layer + its topic (e.g., "Wildfires", "California") and edges connecting them.
- When the user clicks a feature, an "observed" edge is recorded between the user and the entity.
- A **Graph Explorer** panel visualizes the KG for the current map: nodes = layers/places/topics, edges = relationships. Clicking a node highlights related features on the map.

This turns the app from a viewer into a system of record about *what the user has explored and how things connect*.

### 3. Automated Feature Enrichment via AI
When the user clicks a feature (earthquake, wildfire, power plant), the FeatureDetailPanel gets a "🧠 Enrich" button that:
- Sends the feature attributes + location to an AI agent.
- The agent produces a **contextual briefing**: nearby entities from the KG, historical context, similar features on the current map, and a plain-English summary.
- Results are stored back into the KG so subsequent lookups are instant.

### 4. Semantic Layer Search (Vector Embeddings)
Extend the existing AI Search:
- Every layer the user adds gets an **embedding** of its title + snippet stored in a `pgvector` column.
- Future queries do a **semantic + keyword hybrid search** across the user's own layer history first, then fall back to the ArcGIS catalog.
- Result: *"show me that flood layer I added last week"* actually works.

### 5. Insight Generation Agent
A **"Generate Insights"** button on the map produces an AI-written report about the currently visible extent:
- Cross-references all visible layers.
- Uses spatial analysis (intersects, buffers, proximity) via tool calls.
- Outputs a structured markdown briefing with charts (`recharts`) and an option to save/share.

## Design Approach

- Chat opens as a right-side dockable panel (`~360 px`), collapsible.
- Knowledge Graph visualization uses **react-force-graph** or a simple canvas-based force layout — nodes colored by type (layer / place / topic / feature).
- All AI calls run through **Lovable AI Gateway** via an edge function using the AI SDK with tool calling.

## Technical Plan (for whichever features are approved)

### Backend
- New tables: `kg_nodes` (id, type, label, properties jsonb, embedding vector(1536)), `kg_edges` (id, from_id, to_id, relation, properties jsonb), plus RLS scoped to `user_id`.
- Enable `pgvector` extension for embeddings + semantic search.
- Edge functions:
  - `map-agent` — AI SDK `streamText` with tools: `queryLayer`, `spatialIntersect`, `bufferPoint`, `getMapExtent`, `flyToLocation`, `searchLayers`, `enrichFeature`, `queryKG`.
  - `enrich-feature` — one-shot AI briefing for a feature; writes results into KG.
  - `generate-insights` — multi-step agent using `stepCountIs(50)`; produces a structured report.
  - Update existing `geo-ai-search` to write layer nodes/edges into the KG and store embeddings.

### Frontend
- `src/components/ChatPanel.tsx` — AI Elements composer + streaming messages + tool activity display.
- `src/components/KnowledgeGraphView.tsx` — force-directed graph, node/edge inspector, click-to-highlight on map.
- Extend `MapViewHandle` with `getVisibleLayers()`, `highlightFeature(layerId, oid)`, `getExtent()`.
- Add "Enrich" button in `FeatureDetailPanel.tsx`.
- Add "Insights" button in the header alongside Share/Theme/Tutorials.

### Deferred / optional
- Time-series playback of the KG (see how the user's knowledge grew over time).
- Public sharable "map story" combining a briefing + KG snapshot + share link.

## What I need from you

Pick which features to build now — I recommend starting with **#1 (Map Agent)** and **#2 (Knowledge Graph)** together since the agent's tools naturally populate the graph, giving you the most compelling "AI + geospatial + KG" demo in a single build.

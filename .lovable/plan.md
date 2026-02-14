
# Geospatial Tutorial Page

## Overview
Add a comprehensive `/tutorials` page to GeoExplorer with a structured learning path organized by audience role (Leaders, Analysts, Developers). Each track contains multiple tutorials covering geospatial fundamentals through AI-powered product development, with real code examples rendered using `react-markdown`.

## Content Structure

The page will use an accordion-based layout with three main tracks:

**Track 1: Leaders & Strategists**
- What is Geospatial Data? (concepts, coordinate systems, projections)
- The Business Value of Location Intelligence (use cases in logistics, insurance, real estate)
- AI Agents in Geospatial: A Strategic Overview (what AI agents can do, ROI)
- Building a Geospatial Product Roadmap

**Track 2: Analysts & GIS Professionals**
- Working with ArcGIS Feature Services (REST API queries, spatial filters)
- Spatial Analysis Patterns (buffering, overlay, proximity)
- Using AI Agents to Automate Data Discovery (how the AI search in this app works)
- Building Dashboards from Geospatial Data (Recharts + map integration)

**Track 3: Developers & Engineers**
- ArcGIS JS SDK Quickstart (creating a MapView, adding layers -- real code)
- Building Custom Map Components in React (real code examples from this app)
- Integrating AI Agents for Geospatial Search (edge function code walkthrough)
- Creating New Geospatial Products with AI (prompt engineering for geo queries, building pipelines)

Each tutorial will include:
- Title, estimated reading time, difficulty badge
- Rich markdown content with real TypeScript/JavaScript code blocks
- Key takeaways section

## Page Design
- Navigation bar at top linking back to the map
- Tab-based track selection (Leaders / Analysts / Developers)
- Accordion items for each tutorial within a track
- Styled code blocks with syntax context
- Responsive layout with scroll area

## Technical Details

### Files to create:
1. **`src/pages/Tutorials.tsx`** -- Main page component with all tutorial content, using Tabs for tracks and Accordion for individual tutorials. Uses `react-markdown` (already installed) for rendering code examples. Includes a nav header with a link back to the map.

2. **`src/components/TutorialCard.tsx`** -- Reusable component for a single tutorial entry (title, difficulty badge, reading time, expandable markdown content).

### Files to modify:
1. **`src/App.tsx`** -- Add route: `<Route path="/tutorials" element={<ProtectedRoute><Tutorials /></ProtectedRoute>} />`

2. **`src/pages/Index.tsx`** -- Add a small "Tutorials" link/button in the sidebar header for navigation.

### Code Examples Included:
The tutorials will embed real, runnable code snippets such as:
- Creating an ArcGIS MapView in React
- Querying a FeatureServer REST endpoint
- Building an AI-powered layer search edge function (based on the actual `geo-ai-search` function in this project)
- Setting up feature filtering with `definitionExpression`
- Using `hitTest` for feature interaction

### No database changes required.

# Receptio — The Account of Reception
*The historical and strategic record of Cronus Metabolus in the marketplace*

## Commercial Position

Cronus Metabolus serves **ORGAN-III (Commerce / Ergon)** within the ORGANVM ecosystem. It produces content yield automation for:
- Creative agencies managing multi-channel brand distribution
- Direct-to-Consumer (DTC) marketing teams seeking high-velocity content production
- Independent artists and creators turning hero artifacts into public-facing media instruments

## Deployment Footprint

| Component | Target Platform | URL / Identifier |
|-----------|-----------------|------------------|
| API Backend | Cloudflare Workers (Hono) | `http://localhost:3000` (Dev) / Production Worker |
| Dashboard | Cloudflare Pages (React 19) | `http://localhost:5173` (Dev) / Production Pages |
| Database | Neon PostgreSQL 17 | `green-art-84790526` |
| Asset Storage | Cloudflare R2 | `cronus-assets` |
| Pitch Decks | GitHub Pages | `https://organvm.github.io/content-engine--asset-amplifier` |

## Stakeholders & Pilot Alignment

- **Padavano**: Engineering, architecture, dual-runtime API design, queue workers, and autopoietic identity algorithms.
- **Scott Lefler (Lefler Design)**: UI/UX design, marketing narrative, sales collateral, pitch decks (`issue-15` through `issue-20`).

## Delivered Capabilities

1. **Autonomous Brainstorm Ingestion**: `cronus ingest` CLI extracts unstructured strategy notes into JSON Kerygma Profiles without external LLM SDK dependencies.
2. **Computable Brand Identity**: Natural Center derivation synthesizes tonal vectors, aesthetic signatures, and negative space to score and align generated media.
3. **Surface Composer & Grid Simulator**: Visual drag-and-drop layout simulation for Instagram triptychs and multi-platform variants with canonical manifest export.
4. **Interactive Instrument Sandbox**: `apps/narcissus-v0` provides an HTML5 recursive mirror canvas prototype for experiential artwork staging.
5. **Background Processing Suite**: `apps/worker` consumes BullMQ typed job contracts for fragment extraction, LLM content generation, and platform publishing.

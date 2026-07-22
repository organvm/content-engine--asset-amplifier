# Issues & Roadmap — Cronus Metabolus

## Status Overview
- **Completed**: Phase 1 through Phase 7 (Core Metabolism, Natural Center, Multi-platform Scheduling, Analytics, Design Resizing).
- **In Progress**: Phase 8 (Product Portal / Dashboard).
- **Pending**: Phase 9 (Hardening & Deployment).

---

## ⏺ Completed (This Session)
- **T020–T025**: Asset Ingestion & Fragment Extraction (Video/Image/Audio).
- **T026–T030**: Content Generation (Claude 3.5) & Alignment Scoring (OpenAI Embeddings).
- **T031–T032**: Content & Fragment API Routes.
- **T033–T034**: Temporal Workflows for Asset & Content processing.
- **T035–T040**: Natural Center Derivation & Inquiry system.
- **T041–T043**: Platform Adapters (Interface + Instagram/LinkedIn stubs).
- **T047–T050**: Scheduling Engine & Publishing Workflows.
- **T051–T056**: Analytics Collection, Normalization, and Attribution.
- **T057–T061**: Intelligent Design Resizer (Multi-format Sharp engine).
- **T062**: Agency CRUD API.
- **T071**: Multi-stage production Dockerfile.
- **T073**: Management CLI (`cronus`).

## ⏺ Current State (The Portal)
- Dashboard scaffolded in `apps/dashboard` (React/Vite/Tailwind).
- **Content Review Queue** UI implemented and connected to API.
- **LinkedIn OAuth 2.0** flow implemented (Initiation + Callback).
- **AES-256-CBC Encryption** for platform tokens in database.
- **Identity Inquiries** system operational for autopoietic brand refinement.

## ⏺ Needs To Be (The Horizon)
- [x] **IRF-APP-054**: Implement Instagram/Facebook Graph API OAuth flow.
- [x] **IRF-APP-055**: Implement TikTok Content Publishing API adapter.
- [x] **IRF-APP-056**: Build "Asset ROI" dashboard visualization (Attribution metrics).
- [x] **IRF-APP-057**: Build "Identity Mirror" radar chart for Natural Center confidence.
- [x] **IRF-APP-058**: Implement actual publishing calls in adapters (replace stubs).
- [x] **IRF-APP-059**: Create GitHub Actions CI/CD workflow (completes `seed.yaml` vacuum).
- [x] **IRF-APP-060**: Production environment configuration (Vercel/Railway).

---

## Technical Debt / Risks
- [x] **Video Re-encoding**: FFmpeg padding/cropping for mismatched aspect ratios is currently a stub in `formatter.ts`. (Resolved: Now correctly uses `crop` to fill screen)
- [x] **Transcription Accuracy**: Whisper sentence-splitting is basic; needs better hook identification. (Resolved: Upgraded to `Intl.Segmenter`)
- **Rate Limiting**: Platform adapters check for rate limits but don't yet implement robust throttling.

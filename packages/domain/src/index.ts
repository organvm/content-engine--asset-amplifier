/**
 * @cronus/domain — Shared domain types for the Cronus Metabolus system.
 *
 * Single source of truth for all TypeScript types across the content engine.
 * Data shapes only — no classes, no runtime logic.
 */

// ---------------------------------------------------------------------------
// Enums (as const objects for tree-shaking and type narrowing)
// ---------------------------------------------------------------------------

export const MediaType = {
  video: "video",
  image: "image",
  image_set: "image_set",
  design: "design",
} as const satisfies Record<string, string>;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const Platform = {
  instagram_feed: "instagram_feed",
  instagram_story: "instagram_story",
  instagram_reels: "instagram_reels",
  linkedin: "linkedin",
  tiktok: "tiktok",
  youtube_shorts: "youtube_shorts",
  x: "x",
} as const satisfies Record<string, string>;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ProcessingStatus = {
  uploaded: "uploaded",
  processing: "processing",
  extracted: "extracted",
  failed: "failed",
} as const satisfies Record<string, string>;
export type ProcessingStatus =
  (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export const ApprovalStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  flagged: "flagged",
} as const satisfies Record<string, string>;
export type ApprovalStatus =
  (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const PublishStatus = {
  scheduled: "scheduled",
  publishing: "publishing",
  published: "published",
  failed: "failed",
  cancelled: "cancelled",
} as const satisfies Record<string, string>;
export type PublishStatus = (typeof PublishStatus)[keyof typeof PublishStatus];

export const PlatformConnectionStatus = {
  active: "active",
  expired: "expired",
  revoked: "revoked",
} as const satisfies Record<string, string>;
export type PlatformConnectionStatus =
  (typeof PlatformConnectionStatus)[keyof typeof PlatformConnectionStatus];

export const BrandStatus = {
  active: "active",
  paused: "paused",
  archived: "archived",
} as const satisfies Record<string, string>;
export type BrandStatus = (typeof BrandStatus)[keyof typeof BrandStatus];

export const JobStatus = {
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const satisfies Record<string, string>;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JobType = {
  asset_process: "asset_process",
  nc_derive: "nc_derive",
  nc_refine: "nc_refine",
  content_generate: "content_generate",
  content_score: "content_score",
  publish_schedule: "publish_schedule",
  analytics_collect: "analytics_collect",
  design_resize: "design_resize",
} as const satisfies Record<string, string>;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const FragmentType = {
  clip: "clip",
  keyframe: "keyframe",
  crop: "crop",
  text_hook: "text_hook",
  audio_segment: "audio_segment",
} as const satisfies Record<string, string>;
export type FragmentType = (typeof FragmentType)[keyof typeof FragmentType];

export const ScheduleStrategy = {
  optimal: "optimal",
  evenly_distributed: "evenly_distributed",
  manual: "manual",
} as const satisfies Record<string, string>;
export type ScheduleStrategy =
  (typeof ScheduleStrategy)[keyof typeof ScheduleStrategy];

// ---------------------------------------------------------------------------
// Domain interfaces — data shapes only
// ---------------------------------------------------------------------------

export interface Brand {
  id: string;
  agencyId?: string;
  name: string;
  slug: string;
  description?: string;
  brandGuidelinesUrl?: string;
  toneDescription?: string;
  /** Minimum NC alignment score for auto-approval. Default 0.75. */
  consistencyThreshold: number;
  status: BrandStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  contactEmail: string;
  createdAt: Date;
}

export interface NaturalCenter {
  id: string;
  brandId: string;
  version: number;
  thematicCore: Record<string, unknown>;
  aestheticSignature: Record<string, unknown> | string;
  tonalVector: Record<string, unknown> | string;
  narrativeBias: Record<string, unknown> | string;
  symbolicMarkers: Record<string, unknown>[] | string[];
  negativeSpace: Record<string, unknown>[] | string[];
  brandEmbedding: number[];
  confidenceScores: Record<string, number>;
  overallConfidence: number;
  sourceAssetIds: string[];
  systemPrompt: string;
  inquiries: IdentityInquiry[];
  createdAt: Date;
}

export interface IdentityInquiry {
  id: string;
  question: string;
  options?: string[];
  dimension: 'tonal' | 'aesthetic' | 'thematic';
  status: 'pending' | 'answered';
  answer?: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  brandId: string;
  mediaType: MediaType;
  originalFilename: string;
  storageKey: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  transcription?: string;
  processingStatus: ProcessingStatus;
  fragmentCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Fragment {
  id: string;
  assetId: string;
  type: FragmentType;
  storageKey: string;
  startTime?: number;
  endTime?: number;
  description?: string;
  qualityScore: number;
  ncAlignmentScore?: number;
  visualEntropy?: number;
  extractionMetadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ContentUnit {
  id: string;
  fragmentId: string;
  brandId: string;
  platform: Platform;
  caption: string;
  mediaKey: string;
  mediaType: "image" | "video" | "carousel";
  hashtags: string[];
  ncScore: number;
  ncScoreBreakdown: Record<string, number>;
  approvalStatus: ApprovalStatus;
  flaggedReason?: string;
  similarityHash: string;
  createdAt: Date;
}

export interface PublishEvent {
  id: string;
  contentUnitId: string;
  platformConnectionId: string;
  scheduledAt: Date;
  publishedAt?: Date;
  status: PublishStatus;
  platformPostId?: string;
  platformPostUrl?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export interface PerformanceObservation {
  id: string;
  publishEventId: string;
  observedAt: Date;
  views: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  followersGained: number;
  engagementRate?: number;
  normalizedScore?: number;
  rawMetrics: Record<string, unknown>;
}

export interface PlatformConnection {
  id: string;
  brandId: string;
  platform: Platform;
  platformAccountId: string;
  platformAccountName?: string;
  status: PlatformConnectionStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  rateLimitState: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  /** Completion fraction in [0, 1]. */
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Utility types — creation payloads
// ---------------------------------------------------------------------------

export type CreateBrand = Omit<Brand, "id" | "slug" | "createdAt" | "updatedAt">;

export type CreateAsset = Pick<
  Asset,
  "brandId" | "mediaType" | "originalFilename" | "storageKey" | "fileSizeBytes"
> &
  Partial<Pick<Asset, "durationSeconds" | "width" | "height">>;

// ---------------------------------------------------------------------------
// Surface Composer — domain types (issue #35 Phase 0)
// ---------------------------------------------------------------------------

export const ProjectStatus = {
  draft: "draft",
  composing: "composing",
  ready: "ready",
  launched: "launched",
  archived: "archived",
} as const satisfies Record<string, string>;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ProjectType = {
  artwork: "artwork",
  instrument: "instrument",
  performance: "performance",
  series: "series",
  publication: "publication",
} as const satisfies Record<string, string>;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const PublicationFormat = {
  single: "single",
  carousel: "carousel",
  reel: "reel",
  story: "story",
  thread: "thread",
  article: "article",
} as const satisfies Record<string, string>;
export type PublicationFormat =
  (typeof PublicationFormat)[keyof typeof PublicationFormat];

export const EditorialRole = {
  seed: "seed",
  story: "story",
  influence: "influence",
  process: "process",
  instrument: "instrument",
  participant: "participant",
} as const satisfies Record<string, string>;
export type EditorialRole =
  (typeof EditorialRole)[keyof typeof EditorialRole];

export const LinkedAppType = {
  interactive: "interactive",
  generator: "generator",
  download: "download",
  stream: "stream",
  archive: "archive",
  other: "other",
} as const satisfies Record<string, string>;
export type LinkedAppType = (typeof LinkedAppType)[keyof typeof LinkedAppType];

export const LinkedAppHealth = {
  unknown: "unknown",
  healthy: "healthy",
  degraded: "degraded",
  offline: "offline",
} as const satisfies Record<string, string>;
export type LinkedAppHealth =
  (typeof LinkedAppHealth)[keyof typeof LinkedAppHealth];

export const LinkedAppPrivacy = {
  public: "public",
  unlisted: "unlisted",
  private: "private",
} as const satisfies Record<string, string>;
export type LinkedAppPrivacy =
  (typeof LinkedAppPrivacy)[keyof typeof LinkedAppPrivacy];

export const ConversionEventType = {
  project_view: "project_view",
  essay_open: "essay_open",
  application_open: "application_open",
  application_start: "application_start",
  application_complete: "application_complete",
  download: "download",
  share: "share",
  relay_invite: "relay_invite",
  relay_complete: "relay_complete",
  follow_intent: "follow_intent",
} as const satisfies Record<string, string>;
export type ConversionEventType =
  (typeof ConversionEventType)[keyof typeof ConversionEventType];

export interface ProjectInfluence {
  title: string;
  artist?: string;
  url?: string;
  verified: boolean;
}

export interface ProjectCredit {
  role: string;
  name: string;
  url?: string;
}

export interface ArtworkProject {
  id: string;
  brandId: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: ProjectStatus;
  projectType: ProjectType;
  heroAssetId?: string;
  sourceAssetIds: string[];
  canonicalUrl?: string;
  linkedApplicationId?: string;
  hashtagTitle: string[];
  keywords: string[];
  influences: ProjectInfluence[];
  canonicalEssay?: string;
  artistStatement?: string;
  processNote?: string;
  credits: ProjectCredit[];
  rights?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkedApplication {
  id: string;
  projectId: string;
  url: string;
  type: LinkedAppType;
  ctaLabel: string;
  healthStatus: LinkedAppHealth;
  privacy: LinkedAppPrivacy;
  tracking: {
    enabled: boolean;
    campaignKey?: string;
    allowedEvents: ConversionEventType[];
  };
}

export interface PublicationVariant {
  id: string;
  projectId: string;
  contentUnitId?: string;
  platform: Platform;
  format: PublicationFormat;
  editorialRole: EditorialRole;
  caption: string;
  altText?: string;
  headline?: string;
  ctaLabel?: string;
  destinationUrl?: string;
  assetIds: string[];
  approvalStatus: ApprovalStatus;
  sortOrder: number;
}

export interface ConversionEvent {
  id: string;
  projectId: string;
  publishEventId?: string;
  anonymousSessionId: string;
  eventType: ConversionEventType;
  source?: string;
  medium?: string;
  campaign?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export type CreateArtworkProject = Pick<
  ArtworkProject,
  "brandId" | "title" | "projectType"
> &
  Partial<
    Pick<
      ArtworkProject,
      | "subtitle"
      | "heroAssetId"
      | "sourceAssetIds"
      | "hashtagTitle"
      | "keywords"
      | "influences"
      | "canonicalEssay"
      | "artistStatement"
      | "processNote"
      | "credits"
      | "rights"
    >
  >;

export type CreatePublicationVariant = Pick<
  PublicationVariant,
  "projectId" | "platform" | "format" | "editorialRole" | "caption" | "assetIds"
> &
  Partial<
    Pick<
      PublicationVariant,
      "contentUnitId" | "altText" | "headline" | "ctaLabel" | "destinationUrl"
    >
  >;

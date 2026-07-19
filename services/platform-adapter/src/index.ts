import { Platform } from '@cronus/domain';
import { PlatformAdapter } from './interface.js';
import { InstagramAdapter } from './adapters/instagram.js';
import { LinkedInAdapter } from './adapters/linkedin.js';
import { XAdapter } from './adapters/x.js';
import { TikTokAdapter } from './adapters/tiktok.js';
import { YouTubeShortsAdapter } from './adapters/youtube-shorts.js';

const adapters = new Map<Platform, PlatformAdapter>();

export function registerAdapter(adapter: PlatformAdapter) {
  adapters.set(adapter.platform, adapter);
}

// Pre-register known adapters for MVP
registerAdapter(new InstagramAdapter(Platform.instagram_feed));
registerAdapter(new InstagramAdapter(Platform.instagram_story));
registerAdapter(new InstagramAdapter(Platform.instagram_reels));
registerAdapter(new LinkedInAdapter());
registerAdapter(new XAdapter());
registerAdapter(new TikTokAdapter());
registerAdapter(new YouTubeShortsAdapter());

export function getAdapter(platform: Platform): PlatformAdapter {
  const adapter = adapters.get(platform);
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}

export * from './interface.js';

import { describe, it, expect } from 'vitest';
import {
  MediaType,
  Platform,
  ProcessingStatus,
  ApprovalStatus,
  PublishStatus,
  JobType,
  FragmentType,
  ProjectType,
  PublicationFormat,
  EditorialRole,
} from './index.js';

describe('@cronus/domain enums and constants', () => {
  it('should export valid MediaType values', () => {
    expect(MediaType.video).toBe('video');
    expect(MediaType.image).toBe('image');
    expect(MediaType.image_set).toBe('image_set');
    expect(MediaType.design).toBe('design');
  });

  it('should export valid Platform values', () => {
    expect(Platform.instagram_feed).toBe('instagram_feed');
    expect(Platform.instagram_story).toBe('instagram_story');
    expect(Platform.instagram_reels).toBe('instagram_reels');
    expect(Platform.linkedin).toBe('linkedin');
    expect(Platform.tiktok).toBe('tiktok');
    expect(Platform.youtube_shorts).toBe('youtube_shorts');
    expect(Platform.x).toBe('x');
  });

  it('should export valid Status values', () => {
    expect(ProcessingStatus.uploaded).toBe('uploaded');
    expect(ApprovalStatus.pending).toBe('pending');
    expect(PublishStatus.scheduled).toBe('scheduled');
  });

  it('should export valid JobType values', () => {
    expect(JobType.asset_process).toBe('asset_process');
    expect(JobType.publish_schedule).toBe('publish_schedule');
  });

  it('should export valid FragmentType values', () => {
    expect(FragmentType.clip).toBe('clip');
    expect(FragmentType.keyframe).toBe('keyframe');
    expect(FragmentType.crop).toBe('crop');
  });

  it('should export valid Surface Composer constants', () => {
    expect(ProjectType.artwork).toBe('artwork');
    expect(PublicationFormat.single).toBe('single');
    expect(EditorialRole.seed).toBe('seed');
  });
});

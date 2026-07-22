import { describe, it, expect } from 'vitest';
import { validateAssetUpload } from './index.js';
import { MediaType } from '@cronus/domain';

describe('@cronus/asset-ingestion validation', () => {
  it('should accept valid MP4 video files', () => {
    const res = validateAssetUpload('video_sample.mp4', 1024 * 1024);
    expect(res.mediaType).toBe(MediaType.video);
    expect(res.extension).toBe('.mp4');
  });

  it('should accept valid MOV video files', () => {
    const res = validateAssetUpload('clip.MOV', 2 * 1024 * 1024);
    expect(res.mediaType).toBe(MediaType.video);
    expect(res.extension).toBe('.mov');
  });

  it('should accept valid PNG and JPG image files', () => {
    const pngRes = validateAssetUpload('hero.png', 500 * 1024);
    expect(pngRes.mediaType).toBe(MediaType.image);

    const jpgRes = validateAssetUpload('poster.jpg', 800 * 1024);
    expect(jpgRes.mediaType).toBe(MediaType.image);
  });

  it('should throw error for unsupported extensions', () => {
    expect(() => validateAssetUpload('script.sh', 100)).toThrow('Unsupported file type: .sh');
    expect(() => validateAssetUpload('document.pdf', 100)).toThrow('Unsupported file type: .pdf');
  });

  it('should throw error when file size exceeds 2GB limit', () => {
    const OVER_LIMIT = 2 * 1024 * 1024 * 1024 + 1;
    expect(() => validateAssetUpload('huge_render.mp4', OVER_LIMIT)).toThrow('File size exceeds 2GB limit');
  });
});

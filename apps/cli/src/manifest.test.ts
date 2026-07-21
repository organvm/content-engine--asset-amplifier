import { describe, it, expect } from 'vitest';

/**
 * Pure generator function for testing CLI manifest structure.
 */
export function generateManifestFromProfile(profile: Record<string, any>) {
  const title = profile.title || 'Untitled Instrument';
  const slug = (profile.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    manifestVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    project: {
      id: `proj-${slug}`,
      slug,
      title,
      subtitle: profile.subtitle || 'Media Instrument',
      projectType: profile.projectType || 'instrument',
      status: 'ready',
      canonicalEssay: profile.canonicalEssay || '',
      artistStatement: profile.artistStatement || '',
      processNote: profile.processNote || '',
      hashtagTitle: profile.hashtagTitle || [slug],
      keywords: profile.keywords || ['instrument', 'art'],
      influences: profile.influences || [],
      credits: profile.credits || [{ role: 'Author', name: 'Creator' }],
    },
    publicationVariants: [
      {
        platform: 'instagram_feed',
        format: 'carousel',
        editorialRole: 'seed',
        caption: `${title} — Instrument Manifest`,
        sortOrder: 1,
      },
    ],
    linkedApplication: {
      url: `https://instruments.organvm.org/${slug}`,
      type: 'interactive',
      ctaLabel: 'Launch Instrument',
      healthStatus: 'healthy',
      privacy: 'public',
    },
    tracking: {
      enabled: true,
      allowedEvents: ['project_view', 'essay_open', 'application_start', 'relay_complete'],
    },
  };
}

describe('@cronus/cli manifest generation', () => {
  it('should generate valid manifest JSON object from Kerygma profile', () => {
    const manifest = generateManifestFromProfile({
      title: 'Aetheria Soundscape',
      subtitle: 'Generative Audio Instrument',
      canonicalEssay: 'A study on algorithmic acoustics...',
    });

    expect(manifest.manifestVersion).toBe('1.0.0');
    expect(manifest.project.id).toBe('proj-aetheria-soundscape');
    expect(manifest.project.title).toBe('Aetheria Soundscape');
    expect(manifest.publicationVariants).toHaveLength(1);
    expect(manifest.linkedApplication.url).toBe('https://instruments.organvm.org/aetheria-soundscape');
  });
});

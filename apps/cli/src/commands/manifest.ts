import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';

export const manifestCommand = new Command('manifest')
  .description('Generate a Surface Composer instrument JSON manifest from a parsed Kerygma profile')
  .argument('<profilePath>', 'Path to parsed Kerygma JSON file')
  .option('-o, --out <outDir>', 'Output directory for generated manifest.json', '.')
  .action(async (profilePath: string, options: { out: string }) => {
    try {
      const resolvedPath = path.resolve(profilePath);
      const fileContent = await fs.readFile(resolvedPath, 'utf-8');
      const profile = JSON.parse(fileContent);

      const title = profile.title || 'Untitled Instrument';
      const slug = (profile.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const manifest = {
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
          {
            platform: 'linkedin',
            format: 'article',
            editorialRole: 'story',
            caption: `Deconstructing ${title}: An Architectural Overview`,
            sortOrder: 2,
          },
          {
            platform: 'x',
            format: 'thread',
            editorialRole: 'process',
            caption: `1/5 Exploring the mechanics behind ${title} 🧵`,
            sortOrder: 3,
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

      const outDir = path.resolve(options.out);
      await fs.mkdir(outDir, { recursive: true });
      const outFile = path.join(outDir, `${slug}-manifest.json`);

      await fs.writeFile(outFile, JSON.stringify(manifest, null, 2), 'utf-8');
      console.log(`✔ Manifest exported to ${outFile}`);
    } catch (err: unknown) {
      console.error('✖ Manifest generation failed:', (err as Error).message);
      process.exit(1);
    }
  });

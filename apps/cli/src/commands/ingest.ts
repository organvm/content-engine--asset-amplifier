import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';

function extractSection(content: string, heading: string): string | null {
  // Matches "## Heading" or "### Heading" (case insensitive) until the next heading or EOF
  const regex = new RegExp(`^#{2,4}\\s+${heading}\\s*\\n([\\s\\S]*?)(?=^#{2,4}\\s|$)`, 'im');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function parseKerygma(content: string) {
  const kerygma: any = {
    project: 'Extracted Profile',
    account: 'Unknown',
    title: [],
    canonical_url: '',
    voice: { mode: 'default', density: 'medium', promotionality: 'low' },
    visual_rules: { grid_role: 'seed', palette: 'monochrome', preferred_format: 'carousel' },
    caption_forms: [],
    audience_hypothesis: {
      problem_first: { question: 'What problem?', hypothesis: '' },
      identity_first: { question: 'Who are they?', hypothesis: '' },
      opportunity_first: { question: 'What opportunity?', hypothesis: '' }
    },
    kpi_architecture: {
      attention: [],
      engagement_quality: [],
      retention: [],
      owned_audience: [],
      business_impact: []
    }
  };

  const hypothesisSection = extractSection(content, 'Audience Hypothesis') || extractSection(content, 'Hypothesis');
  if (hypothesisSection) {
    kerygma.audience_hypothesis.problem_first.hypothesis = hypothesisSection.split('\n')[0].slice(0, 100);
  }

  const kpiSection = extractSection(content, 'KPIs') || extractSection(content, 'KPI Architecture');
  if (kpiSection) {
    const lines = kpiSection.split('\n').filter(l => l.trim().startsWith('-'));
    kerygma.kpi_architecture.attention = lines.slice(0, 2).map(l => l.replace(/[-*]/g, '').trim());
  }

  return kerygma;
}

function parseArtworkProject(content: string) {
  const project: any = {
    brandId: 'default',
    title: 'Extracted Project',
    subtitle: '',
    projectType: 'artwork',
    hashtagTitle: [],
    keywords: [],
    canonicalEssay: '',
    artistStatement: ''
  };

  const titleSection = extractSection(content, 'Title');
  if (titleSection) project.title = titleSection.split('\n')[0].replace(/[\#\*]/g, '').trim();

  const essaySection = extractSection(content, 'Canonical Essay') || extractSection(content, 'Essay');
  if (essaySection) project.canonicalEssay = essaySection;

  const keywordsSection = extractSection(content, 'Keywords');
  if (keywordsSection) {
    project.keywords = keywordsSection.split(/[,|\n]/).map((k: string) => k.replace(/[-*]/g, '').trim()).filter(Boolean);
  }

  return project;
}

export const ingestCommand = new Command('ingest')
  .description('Ingest an AI brainstorm text file using a heuristic parser and output structured JSON')
  .argument('<inputPath>', 'Path to the text file or directory of brainstorms')
  .option('-t, --type <type>', 'Type of schema to extract: "kerygma" or "project"', 'kerygma')
  .option('-o, --out <outPath>', 'Output file or directory path', './out.json')
  .action(async (inputPath, options) => {
    const fullPath = path.resolve(inputPath);
    const spinner = ora('Reading input file...').start();

    try {
      const stats = await fs.stat(fullPath);
      let files: string[] = [];
      if (stats.isDirectory()) {
        const dirFiles = await fs.readdir(fullPath);
        files = dirFiles
          .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
          .map(f => path.join(fullPath, f));
      } else {
        files = [fullPath];
      }

      for (const file of files) {
        spinner.text = `Processing ${path.basename(file)}...`;
        const content = await fs.readFile(file, 'utf8');

        let jsonOutput: any;
        if (options.type === 'kerygma') {
          jsonOutput = parseKerygma(content);
        } else {
          jsonOutput = parseArtworkProject(content);
        }
        
        const outDir = path.dirname(path.resolve(options.out));
        await fs.mkdir(outDir, { recursive: true });
        
        let writePath = path.resolve(options.out);
        if (stats.isDirectory() || files.length > 1) {
          const parsed = path.parse(file);
          writePath = path.join(outDir, `${parsed.name}_parsed.json`);
        }

        await fs.writeFile(writePath, JSON.stringify(jsonOutput, null, 2));
        spinner.succeed(`Successfully parsed and wrote to ${writePath}`);
      }
    } catch (err) {
      spinner.fail(`Ingestion failed: ${(err as Error).message}`);
    }
  });

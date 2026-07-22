import sharp from 'sharp';

export interface DesignAnalysis {
  focalPoint: { x: number; y: number };
  colorPalette: string[];
  aspectRatio: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

async function extractPalette(buffer: Buffer): Promise<string[]> {
  // Resize to 8x8 for dominant color analysis
  const small = await sharp(buffer)
    .resize(8, 8, { fit: 'fill' })
    .raw()
    .toBuffer();

  const colorCounts = new Map<string, number>();
  for (let i = 0; i < small.length; i += 3) {
    const r = small[i];
    const g = small[i + 1];
    const b = small[i + 2];
    const hex = rgbToHex(r, g, b);
    colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
  }

  // Sort by frequency, return top 5
  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 5).map(([hex]) => hex);
}

export async function analyzeDesign(buffer: Buffer): Promise<DesignAnalysis> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const { width = 1, height = 1 } = metadata;
  const focalPoint = { x: Math.floor(width / 2), y: Math.floor(height / 2) };

  const colorPalette = await extractPalette(buffer);

  return {
    focalPoint,
    colorPalette,
    aspectRatio: width / height,
  };
}

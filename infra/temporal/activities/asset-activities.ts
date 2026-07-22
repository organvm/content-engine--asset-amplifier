import { processAssetFragments } from '@cronus/fragment-extraction';
import { scoreContentUnits } from '@cronus/scoring';
import { getDb, schema } from '@cronus/db';
import { eq, inArray } from '@cronus/db';
import { ProcessingStatus } from '@cronus/domain';

export async function extractFragments(assetId: string): Promise<void> {
  await processAssetFragments(assetId);
}

export async function scoreFragments(assetId: string): Promise<void> {
  const db = getDb();

  const fragments = await db
    .select({ id: schema.fragments.id })
    .from(schema.fragments)
    .where(eq(schema.fragments.asset_id, assetId));

  if (fragments.length === 0) return;

  const fragmentIds = fragments.map(f => f.id);
  const contentUnits = await db
    .select({ id: schema.contentUnits.id })
    .from(schema.contentUnits)
    .where(inArray(schema.contentUnits.fragment_id, fragmentIds));

  if (contentUnits.length > 0) {
    await scoreContentUnits(contentUnits.map(u => u.id));
  }
}

export async function updateAssetStatus(assetId: string, status: ProcessingStatus): Promise<void> {
  const db = getDb();
  await db.update(schema.assets)
    .set({ processing_status: status })
    .where(eq(schema.assets.id, assetId));
}

import { getDb, schema } from '@cronus/db';
import { eq, and, inArray } from '@cronus/db';
import { ApprovalStatus } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('content-generation:dedup');

export interface MinimalContentUnit {
  id: string;
  platform: string;
  caption: string;
  mediaKey: string;
}

/**
 * Pure function to identify duplicate content units from a list.
 */
export function findDuplicateContentUnits(units: MinimalContentUnit[]): Array<{ id: string; reason: string }> {
  const seenCaptions = new Map<string, string>(); // captionKey:unitId
  const seenMedia = new Map<string, string>(); // mediaKey:unitId
  const duplicates: Array<{ id: string; reason: string }> = [];

  for (const unit of units) {
    const captionKey = `${unit.platform}:${unit.caption.slice(0, 100).trim()}`;
    const mediaKey = `${unit.platform}:${unit.mediaKey}`;

    if (seenCaptions.has(captionKey)) {
      duplicates.push({
        id: unit.id,
        reason: `Duplicate caption found in unit ${seenCaptions.get(captionKey)}`,
      });
      continue;
    }

    if (seenMedia.has(mediaKey)) {
      duplicates.push({
        id: unit.id,
        reason: `Duplicate media key used for ${unit.platform}`,
      });
      continue;
    }

    seenCaptions.set(captionKey, unit.id);
    seenMedia.set(mediaKey, unit.id);
  }

  return duplicates;
}

/**
 * Identifies and flags duplicate content units for a brand in DB.
 */
export async function deduplicateContentUnits(brandId: string, contentUnitIds: string[]) {
  const db = getDb();
  
  const rows = await db
    .select()
    .from(schema.contentUnits)
    .where(
      and(
        eq(schema.contentUnits.brand_id, brandId),
        inArray(schema.contentUnits.id, contentUnitIds)
      )
    );

  if (rows.length === 0) return;

  log.info({ brandId, count: rows.length }, 'Running deduplication');

  const units: MinimalContentUnit[] = rows.map(r => ({
    id: r.id,
    platform: r.platform,
    caption: r.caption,
    mediaKey: r.media_key,
  }));

  const duplicates = findDuplicateContentUnits(units);

  for (const dup of duplicates) {
    await flagDuplicate(dup.id, dup.reason);
  }
}

async function flagDuplicate(unitId: string, reason: string) {
  const db = getDb();
  log.info({ unitId, reason }, 'Flagging duplicate content unit');
  
  await db.update(schema.contentUnits)
    .set({ 
      approval_status: ApprovalStatus.flagged,
      flagged_reason: reason 
    })
    .where(eq(schema.contentUnits.id, unitId));
}

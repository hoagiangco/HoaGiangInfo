import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import {
  DEFAULT_FOOTER_CONFIG,
  FOOTER_SETTING_KEY,
  normalizeFooterConfig,
  type FooterConfig,
} from './footer-config';

function hasSiteSettingDelegate(): boolean {
  const client = prisma as unknown as {
    siteSetting?: { findUnique?: unknown; upsert?: unknown };
  };
  return (
    typeof client.siteSetting?.findUnique === 'function' &&
    typeof client.siteSetting?.upsert === 'function'
  );
}

/**
 * Load footer & concierge bar settings from DB.
 * Falls back safely to DEFAULT_FOOTER_CONFIG if not yet configured or during migrations.
 */
export async function getFooterConfig(): Promise<FooterConfig> {
  try {
    if (hasSiteSettingDelegate()) {
      const row = await prisma.siteSetting.findUnique({
        where: { key: FOOTER_SETTING_KEY },
      });
      if (!row) {
        return normalizeFooterConfig(DEFAULT_FOOTER_CONFIG);
      }
      return normalizeFooterConfig(row.value);
    }

    // Fallback for hot-reloaded dev server before restart
    const rows = await prisma.$queryRaw<Array<{ value: unknown }>>`
      SELECT "value" FROM "SiteSetting" WHERE "key" = ${FOOTER_SETTING_KEY} LIMIT 1
    `;
    if (!rows[0]) {
      return normalizeFooterConfig(DEFAULT_FOOTER_CONFIG);
    }
    return normalizeFooterConfig(rows[0].value);
  } catch (error) {
    console.error('Error loading footer settings, falling back to default:', error);
    return normalizeFooterConfig(DEFAULT_FOOTER_CONFIG);
  }
}

/**
 * Persist validated footer settings to DB.
 */
export async function saveFooterConfig(config: FooterConfig): Promise<FooterConfig> {
  const normalized = normalizeFooterConfig(config);

  if (hasSiteSettingDelegate()) {
    const row = await prisma.siteSetting.upsert({
      where: { key: FOOTER_SETTING_KEY },
      update: {
        value: normalized as unknown as Prisma.InputJsonValue,
      },
      create: {
        key: FOOTER_SETTING_KEY,
        value: normalized as unknown as Prisma.InputJsonValue,
      },
    });
    return normalizeFooterConfig(row.value);
  }

  // Fallback for hot-reloaded dev server before restart
  const serialized = JSON.stringify(normalized);
  await prisma.$executeRaw`
    INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
    VALUES (${FOOTER_SETTING_KEY}, ${serialized}::jsonb, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
  `;
  return normalized;
}

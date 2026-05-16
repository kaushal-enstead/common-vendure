// eslint-disable-next-line @typescript-eslint/no-require-imports
const probe = require('probe-image-size') as (
  url: string,
) => Promise<{ width: number; height: number; mime: string; length?: number }>;

export function parseJson<T>(json: string | null | T): T | null {
  try {
    if (!json || json === '') return null;
    return typeof json === 'string' ? JSON.parse(json) : json;
  } catch (error) {
    return null;
  }
}

export function parseCustomField<T>(
  json: string | null | T,
  extractor?: (obj: T) => any,
  stringify = true,
): string | undefined {
  const parsed = parseJson<T>(json);
  if (!parsed) return undefined;
  const value = extractor ? extractor(parsed) : parsed;
  return stringify ? JSON.stringify(value) : value;
}

const IMAGE_DIMENSION_CONCURRENCY = 100;

/** Get image dimensions with minimal download (header only); uses probe-image-size. */
export async function getImageDimensions(url: string) {
  // const result = await probe(url);
  await new Promise(resolve => setTimeout(resolve, 0));
  const result = {
    width: 0,
    height: 0,
    mime: 'image/jpeg',
    length: 0,
  };
  return {
    width: result.width,
    height: result.height,
    fileSize: result.length ?? 0,
    mimeType: result.mime ?? 'image/jpeg',
  };
}

/** Run getImageDimensions for many URLs in parallel with a concurrency limit. */
export async function getImageDimensionsBatch(
  items: Array<{ url: string }>,
  concurrency = IMAGE_DIMENSION_CONCURRENCY,
): Promise<Array<{ width?: number; height?: number; fileSize?: number; mimeType?: string }>> {
  const results: Array<{ width?: number; height?: number; fileSize?: number; mimeType?: string }> = new Array(
    items.length,
  );
  const defaults = { width: 0, height: 0, fileSize: 0, mimeType: 'image/jpeg' as string };

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(chunk.map(item => getImageDimensions(item.url)));
    chunkResults.forEach((outcome, j) => {
      const idx = i + j;
      results[idx] =
        outcome.status === 'fulfilled'
          ? {
              width: outcome.value.width,
              height: outcome.value.height,
              fileSize: outcome.value.fileSize,
              mimeType: outcome.value.mimeType,
            }
          : defaults;
    });
  }
  return results;
}

export function slugify(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

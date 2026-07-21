import keys from "./mdFileKeys.json";

/** One embedded reference file: p = display path, c = raw file contents. */
export type MdFile = { p: string; c: string };

/**
 * Tiny key list (generated alongside mdFiles.json). Statically imported so the
 * synchronous clickability check below costs ~nothing — the heavy per-file
 * content lives in mdFiles.json, which is loaded lazily via loadMdFile().
 */
const KEYS = new Set<string>(keys as string[]);

/** True if a given chip key has embedded content (so it should be clickable). */
export function hasMdFile(key: string): boolean {
  return KEYS.has(key);
}

/** Cached content map, populated on the first loadMdFile() call. */
let cache: Record<string, MdFile> | null = null;

/**
 * Lazily resolve one embedded file's content. The ~224KB mdFiles.json is a
 * separate async chunk that is fetched only on the first call (i.e. the first
 * time the Monokai viewer opens), then cached for subsequent opens. Returns
 * null for unknown keys.
 */
export async function loadMdFile(key: string): Promise<MdFile | null> {
  if (!KEYS.has(key)) return null;
  if (!cache) {
    const mod = await import("./mdFiles.json");
    cache = (mod.default ?? mod) as Record<string, MdFile>;
  }
  return cache[key] ?? null;
}

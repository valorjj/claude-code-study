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

/** Cached content map, populated on the first loadAllMdFiles() call. */
let cache: Record<string, MdFile> | null = null;

/**
 * Lazily load the full embedded-content map. The ~224KB mdFiles.json is a
 * separate async chunk, fetched only on the first call (first modal open OR
 * first search), then cached. Shared by loadMdFile and the search index.
 */
export async function loadAllMdFiles(): Promise<Record<string, MdFile>> {
  if (!cache) {
    const mod = await import("./mdFiles.json");
    cache = (mod.default ?? mod) as Record<string, MdFile>;
  }
  return cache;
}

/**
 * Lazily resolve one embedded file's content (via the shared cache). Returns
 * null for unknown keys.
 */
export async function loadMdFile(key: string): Promise<MdFile | null> {
  if (!KEYS.has(key)) return null;
  const map = await loadAllMdFiles();
  return map[key] ?? null;
}

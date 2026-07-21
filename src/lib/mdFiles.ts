import raw from "./mdFiles.json";

/** One embedded reference file: p = display path, c = raw file contents. */
export type MdFile = { p: string; c: string };

/** Map of chip-key -> file. Keys are the paths shown on the chips/tree nodes. */
export const mdFiles: Record<string, MdFile> = raw as Record<string, MdFile>;

/** True if a given chip key has embedded content (so it should be clickable). */
export function hasMdFile(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(mdFiles, key);
}

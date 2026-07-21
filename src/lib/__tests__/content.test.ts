import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WRAPS } from "@/components/sections/DocsTree";

// Read the pipeline SSOT + its generated output directly (vitest runs from repo root).
type ManifestEntry = { key: string; p: string };
type MdFile = { p: string; c: string };

const manifest = JSON.parse(readFileSync("content/manifest.json", "utf8")) as ManifestEntry[];
const mdFiles = JSON.parse(readFileSync("src/lib/mdFiles.json", "utf8")) as Record<string, MdFile>;
const mdFileKeys = JSON.parse(readFileSync("src/lib/mdFileKeys.json", "utf8")) as string[];

describe("content pipeline (content/ ↔ generated mdFiles.json)", () => {
  it("every manifest key is present with non-empty content", () => {
    for (const { key } of manifest) {
      expect(mdFiles[key], `manifest key missing from mdFiles: ${key}`).toBeTruthy();
      expect(mdFiles[key].c.length, `empty content for ${key}`).toBeGreaterThan(0);
    }
  });

  it("has no orphan entries (mdFiles ⊆ manifest)", () => {
    const keys = new Set(manifest.map((m) => m.key));
    for (const k of Object.keys(mdFiles)) {
      expect(keys.has(k), `orphan mdFiles key not in manifest: ${k}`).toBe(true);
    }
  });

  it("has no duplicate manifest keys", () => {
    const keys = manifest.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("the tiny keys manifest matches the content map exactly", () => {
    // mdFileKeys.json drives hasMdFile() without loading the heavy content;
    // it must stay a faithful key list of mdFiles.json (both are generated).
    expect([...mdFileKeys].sort()).toEqual(Object.keys(mdFiles).sort());
  });
});

describe("docs tree clickable chips", () => {
  it("every clickable tree file-key resolves to an embedded file", () => {
    for (const [token, key] of WRAPS) {
      expect(mdFiles[key], `tree chip "${token}" points at missing key: ${key}`).toBeTruthy();
    }
  });
});

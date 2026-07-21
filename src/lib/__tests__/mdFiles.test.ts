import { describe, expect, it } from "vitest";
import { hasMdFile, loadAllMdFiles, loadMdFile } from "@/lib/mdFiles";
import keys from "@/lib/mdFileKeys.json";

const KEYS = keys as string[];

describe("mdFiles lazy access", () => {
  it("hasMdFile reflects the keys manifest", () => {
    expect(hasMdFile(KEYS[0])).toBe(true);
    expect(hasMdFile("definitely/not/a/key")).toBe(false);
  });

  it("loadAllMdFiles resolves the full map with matching keys", async () => {
    const map = await loadAllMdFiles();
    expect(Object.keys(map).sort()).toEqual([...KEYS].sort());
  });

  it("loadMdFile returns content for a known key and null otherwise", async () => {
    const f = await loadMdFile(KEYS[0]);
    expect(f?.c.length ?? 0).toBeGreaterThan(0);
    expect(await loadMdFile("nope")).toBeNull();
  });
});

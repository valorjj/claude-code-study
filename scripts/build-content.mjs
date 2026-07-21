// Content pipeline: content/ is the SSOT for embedded reference files.
// Reads content/manifest.json ([{ key, p }]) + each file at content/<p>,
// and generates two artifacts:
//   - src/lib/mdFiles.json     ({ [key]: { p, c } }) — the heavy content map,
//     dynamic-imported (lazy) so it stays out of the initial JS bundle.
//   - src/lib/mdFileKeys.json  (["key", ...])         — the tiny key list,
//     statically imported by FileChip for the synchronous clickability check.
//
// Run: `npm run content`. Also runs automatically on predev/prebuild.
// To add a reference file: drop it under content/<path>, add a {key,p} entry
// to content/manifest.json, run `npm run content`, then reference the key
// from a FileChip / the docs tree.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "content/manifest.json"), "utf8"));

const out = {};
for (const { key, p } of manifest) {
  if (!key || !p) throw new Error(`manifest entry missing key/p: ${JSON.stringify({ key, p })}`);
  if (out[key]) throw new Error(`duplicate manifest key: ${key}`);
  out[key] = { p, c: readFileSync(join(root, "content", p), "utf8") };
}

writeFileSync(join(root, "src/lib/mdFiles.json"), JSON.stringify(out), "utf8");
writeFileSync(join(root, "src/lib/mdFileKeys.json"), JSON.stringify(Object.keys(out)), "utf8");
console.log(`build-content: wrote src/lib/mdFiles.json + mdFileKeys.json (${manifest.length} files)`);

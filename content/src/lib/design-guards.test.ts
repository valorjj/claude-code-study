import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

/**
 * Design-language guards (design spec: docs/superpowers/specs/
 * 2026-07-08-design-language-overhaul-design.md).
 *
 * 1. Density: every page component declares its density tier so spacing is a
 *    deliberate choice, never an accident (spec P5).
 */

const here = dirname(fileURLToPath(import.meta.url)); // src/lib
const src = join(here, '..');
const DENSITY_RE = /data-density="(compact|regular|spacious)"/;

function pageFiles(): string[] {
  const out: string[] = [];
  const featuresDir = join(src, 'features');
  for (const feature of readdirSync(featuresDir)) {
    const pagesDir = join(featuresDir, feature, 'pages');
    let entries: string[] = [];
    try {
      entries = readdirSync(pagesDir);
    } catch {
      continue; // feature has no pages/
    }
    for (const f of entries) {
      if (f.endsWith('.svelte') && statSync(join(pagesDir, f)).isFile()) {
        out.push(join(pagesDir, f));
      }
    }
  }
  // The create route hosts its page inline rather than via a feature page.
  out.push(join(src, 'routes', '(portal)', 'create', '+page.svelte'));
  return out;
}

/**
 * Page-archetype shells (e.g. `DetailPageShell`) own the root element and
 * declare `data-density` themselves — the orchestrator page that mounts one
 * never repeats the literal (Phase 3a: DetailPage is a thin orchestrator over
 * `DetailPageShell`). Discover every `.svelte` file that itself declares
 * `data-density` and treat a page as compliant if it renders one of them,
 * so the guard's intent (every page has a *deliberate*, traceable density)
 * survives the shell-owns-the-root pattern instead of forcing a redundant
 * (and layout-breaking, since the shell already renders the wrapping
 * `main-inner` div) second declaration in the page itself.
 */
function densityDeclaringComponentNames(): Set<string> {
  const names = new Set<string>();
  function walkSvelte(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walkSvelte(full);
      } else if (entry.endsWith('.svelte') && DENSITY_RE.test(readFileSync(full, 'utf8'))) {
        names.add(entry.replace(/\.svelte$/, ''));
      }
    }
  }
  walkSvelte(join(src, 'features'));
  // Shared shells (e.g. `FormPageShell`) also live outside features/, in
  // shared/components — scan there too so cross-feature shells count.
  walkSvelte(join(src, 'shared'));
  return names;
}

describe('design guards — density', () => {
  it('every page declares data-density (compact|regular|spacious), directly or via its shell', () => {
    const shellNames = densityDeclaringComponentNames();
    const offenders = pageFiles()
      .filter((f) => {
        const content = readFileSync(f, 'utf8');
        if (DENSITY_RE.test(content)) return false;
        for (const name of shellNames) {
          if (new RegExp(`<${name}[\\s(/>]`).test(content)) return false;
        }
        return true;
      })
      .map((f) => relative(src, f));
    expect(
      offenders,
      `Pages missing a data-density declaration, directly or via a shell component (design spec P5 — pick compact/regular/spacious):\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });
});

/**
 * 2. Hex baseline: no NEW hex color literals outside styles/app.css.
 *    Existing literals are frozen in design-guards.baseline.json (they are
 *    migration debt, not license). A file may reduce its count freely; any
 *    increase, or any hex in a new file, fails. To intentionally rebaseline
 *    after reducing debt: UPDATE_DESIGN_BASELINE=1 pnpm --filter process-governance test -- design-guards
 */

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const SCAN_EXT = /\.(svelte|css|ts)$/;
const SKIP = /(^|\/)(node_modules|dist|build|\.svelte-kit|coverage)(\/|$)/;
const ALLOWED = new Set(['styles/app.css']); // the token SSoT may define hexes

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP.test(full)) continue;
    if (/\.test\.ts$/.test(full)) continue; // test files aren't shipped UI — skip
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(full)) out.push(full);
  }
}

function currentHexCounts(): Record<string, number> {
  const files: string[] = [];
  walk(src, files);
  const counts: Record<string, number> = {};
  for (const f of files) {
    const rel = relative(src, f);
    if (ALLOWED.has(rel)) continue;
    const n = (readFileSync(f, 'utf8').match(HEX_RE) ?? []).length;
    if (n > 0) counts[rel] = n;
  }
  return counts;
}

const BASELINE_PATH = join(here, 'design-guards.baseline.json');

describe('design guards — hex literals', () => {
  it('no file gains hex color literals (use --pap-* tokens; baseline shrinks only)', () => {
    const current = currentHexCounts();
    if (process.env.UPDATE_DESIGN_BASELINE === '1') {
      writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n');
      return;
    }
    const baseline: Record<string, number> = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    const offenders = Object.entries(current)
      .filter(([file, n]) => n > (baseline[file] ?? 0))
      .map(([file, n]) => `${file}: ${baseline[file] ?? 0} -> ${n}`);
    expect(
      offenders,
      `Hex color literals increased — new colors must come from --pap-* tokens in styles/app.css:\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });
});

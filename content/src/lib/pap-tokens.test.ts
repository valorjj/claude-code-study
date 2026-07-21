import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

/**
 * PAP accent-token guard.
 *
 * The PAP brand accent is blue, exposed as `--pap-accent` (+ `-soft`/`-strong`).
 * The raw `--primary-*` family is the *per-app re-branded* token — green in the
 * legacy `@repo/ui` ecoletree palette, teal in `automation`. So any PAP-surface
 * code that *reads* `var(--primary-…)` silently inherits whatever the host app's
 * brand is (green here, teal there) instead of PAP blue. That leak is invisible
 * in review — it only shows up as a wrong-coloured pixel — which is exactly the
 * kind of "surprise" this guard exists to make impossible.
 *
 * Rule: in the PAP surface (this app + the portable `@repo/agent-ui` widget),
 * never *read* a brand token via `var(--primary-…)`. Point at `--pap-accent*`.
 *
 * What is NOT a violation (and why the pattern is `var(--primary-`, not `--primary-`):
 *   - comments documenting this very rule use bare `--primary-*`
 *   - the sanctioned remap layer (`styles/ecoletree-overrides.css`) *defines*
 *     `--primary-500: var(--pap-accent)` to bridge ecoletree composites — that's
 *     a definition (`--primary-N:`), not a read (`var(--primary-`).
 */

const here = dirname(fileURLToPath(import.meta.url)); // apps/process-governance/src/lib
const repoRoot = join(here, '..', '..', '..', '..');

// PAP surface = this app's source + the portable shared widget package.
const SCAN_ROOTS = [
  join(here, '..'), // apps/process-governance/src
  join(repoRoot, 'packages', 'agent-ui', 'src')
];

const SCAN_EXT = /\.(svelte|css|ts|js)$/;
const SKIP_DIR = /(^|\/)(node_modules|dist|build|\.svelte-kit|coverage)(\/|$)/;
const READ_PRIMARY = /var\(\s*--primary-/; // a *read* of the re-branded token

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_DIR.test(full)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(full) && !full.endsWith('pap-tokens.test.ts')) out.push(full);
  }
}

describe('PAP accent tokens', () => {
  it('never reads var(--primary-*) in the PAP surface (use --pap-accent*)', () => {
    const offenders: string[] = [];
    for (const root of SCAN_ROOTS) {
      const files: string[] = [];
      walk(root, files);
      for (const file of files) {
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            if (READ_PRIMARY.test(line)) {
              offenders.push(`${relative(repoRoot, file)}:${i + 1}  ${line.trim()}`);
            }
          });
      }
    }
    expect(
      offenders,
      `Found var(--primary-*) reads in PAP-surface code — these leak the host app's ` +
        `brand colour (green/teal) instead of PAP blue. Replace with --pap-accent / ` +
        `--pap-accent-soft / --pap-accent-strong:\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });
});

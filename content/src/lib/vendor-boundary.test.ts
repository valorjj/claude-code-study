import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

/**
 * Vendor-boundary guard (CLAUDE.md req #2).
 *
 * The LLM is swappable — Gemini now, Claude later — and the swap must stay a
 * one-line config change. For that to hold, vendor specifics must live in exactly
 * ONE place: `packages/agent-core/src/llm/` (the `LLMProvider` implementations).
 * Two kinds of vendor coupling are therefore banned everywhere else in the PAP
 * surface:
 *   1. Vendor SDKs / raw vendor endpoints (`@google/genai`, `@anthropic-ai/sdk`,
 *      `generativelanguage.googleapis.com`, `GoogleGenAI`, `new Anthropic`).
 *   2. Real vendor model ids (`gemini-3…`, `claude-sonnet…`, `claude-3…`).
 *
 * Allowed (not coupling):
 *   - The provider *wrapper* class name `GeminiProvider` — that is OUR seam, the
 *     one-line swap point the host instantiates; it is not a vendor SDK symbol.
 *   - Placeholder model names in tests (`gemini-custom`, `test-model-x`) — the
 *     pattern only matches *real* ids (a digit / opus|sonnet|haiku after the dash),
 *     so tests can exercise the model-config path without pasting a real id.
 *
 * Scope note: the separate `apps/automation` app has its own user-facing model
 * picker and is deliberately NOT policed here — req #2 is a process-governance /
 * shared-agent-package invariant. This guard mirrors the routes/pap-token guards:
 * same Vitest pipeline, no new infra.
 */

const here = dirname(fileURLToPath(import.meta.url)); // apps/process-governance/src/lib
const repoRoot = join(here, '..', '..', '..', '..');

// PAP surface = this app + the portable shared agent packages.
const SCAN_ROOTS = [
  join(here, '..'), // apps/process-governance/src
  join(repoRoot, 'packages', 'agent-core', 'src'),
  join(repoRoot, 'packages', 'agent-ui', 'src'),
  join(repoRoot, 'packages', 'agent-types', 'src')
];

// The single sanctioned home for vendor SDKs, endpoints, and the real model id.
const ALLOWED = 'packages/agent-core/src/llm/';

const SCAN_EXT = /\.(svelte|css|ts|js)$/;
const SKIP_DIR = /(^|\/)(node_modules|dist|build|\.svelte-kit|coverage)(\/|$)/;

const VENDOR_SDK =
  /@google\/(?:genai|generative-ai)|@anthropic-ai|generativelanguage\.googleapis|aiplatform\.googleapis|\bGoogleGenAI\b|new\s+Anthropic\b/;
// Real model ids only: a digit, or an Anthropic family name, right after the dash.
const MODEL_ID = /\bgemini-\d|\bclaude-(?:opus|sonnet|haiku|\d)/;

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_DIR.test(full)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(full) && !full.endsWith('vendor-boundary.test.ts')) out.push(full);
  }
}

describe('vendor boundary', () => {
  it('keeps vendor SDKs + real model ids inside packages/agent-core/src/llm only', () => {
    const offenders: string[] = [];
    for (const root of SCAN_ROOTS) {
      if (!existsSync(root)) continue;
      const files: string[] = [];
      walk(root, files);
      for (const file of files) {
        const rel = relative(repoRoot, file).replace(/\\/g, '/');
        if (rel.includes(ALLOWED)) continue; // the one allowed home
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            const sdk = VENDOR_SDK.test(line);
            const model = MODEL_ID.test(line);
            if (sdk || model) {
              offenders.push(`${rel}:${i + 1}  [${sdk ? 'sdk' : 'model-id'}]  ${line.trim()}`);
            }
          });
      }
    }
    expect(
      offenders,
      `Vendor coupling found outside ${ALLOWED} — this breaks the one-line ` +
        `Gemini→Claude swap (req #2). Move SDK/endpoint use into an LLMProvider in ` +
        `that dir, and reference the model id via DEFAULT_AGENT_MODEL instead of a ` +
        `literal:\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });
});

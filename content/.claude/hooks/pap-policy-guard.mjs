#!/usr/bin/env node
/**
 * PreToolUse guard — blocks an Edit/Write/MultiEdit BEFORE it lands if it would
 * introduce a violation of two load-bearing process-governance rules. This is the
 * strongest rung of the policy ladder (the matching Vitest guards in
 * apps/process-governance/docs/guards.md remain the CI backstop; this stops the
 * write up front so the model self-corrects immediately).
 *
 * Rules (mirrors pap-tokens.test.ts / vendor-boundary.test.ts EXACTLY — guards.md is SSOT):
 *   1. PAP accent: no `var(--primary-*)` reads in the PAP surface
 *      (apps/process-governance/src, packages/agent-ui/src). Use --pap-accent*.
 *   2. Vendor boundary: no vendor SDK/endpoint or real model id outside
 *      packages/agent-core/src/llm (across pg src + agent-{core,ui,types} src).
 *
 * Contract: read the hook JSON on stdin; exit 2 + stderr to block; exit 0 to allow.
 * Fails OPEN (exit 0) on any parse/unknown error so it never wedges editing.
 */

import { readFileSync } from 'node:fs';

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const SCAN_EXT = /\.(svelte|css|ts|js)$/;
const READ_PRIMARY = /var\(\s*--primary-/;
const VENDOR_SDK =
  /@google\/(?:genai|generative-ai)|@anthropic-ai|generativelanguage\.googleapis|aiplatform\.googleapis|\bGoogleGenAI\b|new\s+Anthropic\b/;
const MODEL_ID = /\bgemini-\d|\bclaude-(?:opus|sonnet|haiku|\d)/;

function allow() {
  process.exit(0);
}
function block(reason) {
  process.stderr.write(reason + '\n');
  process.exit(2);
}

let payload;
try {
  payload = JSON.parse(readStdin());
} catch {
  allow(); // can't parse — don't wedge editing
}

const toolInput = payload?.tool_input ?? {};
const filePath = String(toolInput.file_path ?? '').replace(/\\/g, '/');
if (!filePath || !SCAN_EXT.test(filePath)) allow();

// The text about to be written (Write=content, Edit=new_string, MultiEdit=edits[].new_string)
const text = [
  typeof toolInput.content === 'string' ? toolInput.content : '',
  typeof toolInput.new_string === 'string' ? toolInput.new_string : '',
  Array.isArray(toolInput.edits)
    ? toolInput.edits.map((e) => e?.new_string ?? '').join('\n')
    : ''
].join('\n');
if (!text.trim()) allow();

const inPgSrc = filePath.includes('apps/process-governance/src/');
const inAgentUi = filePath.includes('packages/agent-ui/src/');
const inAgentCore = filePath.includes('packages/agent-core/src/');
const inAgentTypes = filePath.includes('packages/agent-types/src/');
const inVendorHome = filePath.includes('packages/agent-core/src/llm/');

const violations = [];

// Rule 1 — PAP accent tokens
if ((inPgSrc || inAgentUi) && !filePath.endsWith('pap-tokens.test.ts')) {
  if (READ_PRIMARY.test(text)) {
    violations.push(
      'PAP accent: this edit reads `var(--primary-*)`, which leaks the host brand ' +
        '(green/teal) instead of PAP blue. Use `--pap-accent` / `--pap-accent-soft` / ' +
        '`--pap-accent-strong`.'
    );
  }
}

// Rule 2 — vendor boundary
const inVendorScope = inPgSrc || inAgentCore || inAgentUi || inAgentTypes;
if (inVendorScope && !inVendorHome && !filePath.endsWith('vendor-boundary.test.ts')) {
  const sdk = VENDOR_SDK.test(text);
  const model = MODEL_ID.test(text);
  if (sdk || model) {
    violations.push(
      `Vendor boundary: this edit adds a ${sdk ? 'vendor SDK/endpoint' : 'real model id'} ` +
        'outside `packages/agent-core/src/llm`, breaking the one-line Gemini→Claude swap ' +
        '(req #2). Keep vendor SDK/endpoint/model-id in an LLMProvider there; reference the ' +
        'model via DEFAULT_AGENT_MODEL.'
    );
  }
}

if (violations.length) {
  block(
    'Blocked by PAP policy guard (.claude/hooks/pap-policy-guard.mjs · see ' +
      'apps/process-governance/docs/guards.md):\n- ' +
      violations.join('\n- ')
  );
}

allow();

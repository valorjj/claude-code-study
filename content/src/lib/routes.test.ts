import { describe, it, expect } from 'vitest';
import { APP_ROUTES } from './routes';
import { primaryNav, utilityNav, flattenLeaves } from '../shared/layout/nav-menu';

/**
 * APP_ROUTES feeds the agent's `navigate_to` tool. It once held only 3 entries
 * (one of which the model couldn't usefully reach), so the agent silently failed
 * to navigate to most pages. These guards keep it honest as the IA evolves.
 */
describe('APP_ROUTES', () => {
  it('has unique ids and unique paths', () => {
    const ids = APP_ROUTES.map((r) => r.id);
    const paths = APP_ROUTES.map((r) => r.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('uses base-less paths and non-empty Korean-or-ascii labels', () => {
    for (const r of APP_ROUTES) {
      expect(r.path.startsWith('/')).toBe(true);
      expect(r.path).not.toMatch(/^\/process-governance/); // base is prepended later, not here
      expect(r.label.trim().length).toBeGreaterThan(0);
    }
  });

  // Drift guard: every navigable sidebar leaf must be reachable by navigate_to.
  it('covers every sidebar leaf path (nav-menu.ts)', () => {
    const routePaths = new Set(APP_ROUTES.map((r) => r.path));
    const leaves = flattenLeaves([...primaryNav, ...utilityNav]);
    const missing = leaves
      .map((l) => l.path!)
      .filter((p) => !routePaths.has(p));
    expect(missing, `nav-menu leaves missing from APP_ROUTES: ${missing.join(', ')}`).toEqual([]);
  });
});

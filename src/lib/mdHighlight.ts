/**
 * Minimal, fence-aware markdown highlighter → HTML string (Monokai Pro classes).
 * Ported from the standalone doc. Escapes first, then wraps tokens in <span>.
 * Output is injected via dangerouslySetInnerHTML into a <code> inside the viewer.
 */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightMarkdown(md: string): string {
  let fence = false;
  return md
    .split("\n")
    .map((line) => {
      const e = esc(line);
      if (/^\s*```/.test(line)) {
        fence = !fence;
        return `<span class="md-code">${e}</span>`;
      }
      if (fence) return `<span class="md-code">${e}</span>`;
      if (/^\s*#{1,6}\s/.test(line)) return `<span class="md-h">${e}</span>`;
      if (/^\s*&gt;/.test(e)) return `<span class="md-quote">${e}</span>`;
      let x = e.replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>');
      x = x.replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>');
      x = x.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<span class="md-link">[$1]($2)</span>',
      );
      x = x.replace(/\|/g, '<span class="md-punc">|</span>');
      return x;
    })
    .join("\n");
}

// The information pages (scripts/build_pages.mjs) show their paragraphs as the panel does (app.js, bulletize): the
// answer in bold, if a paragraph opens with one, on a line of its own, then each sentence as a bullet. The words in the
// page stay as they are for search engines and readers without scripts; only how they are shown changes (28 Nov 2026,
// the user: "her yerde paragraf var").

function sentencesOf(html) {
  const out = []; let cur = '', depth = 0, i = 0;
  while (i < html.length) {
    const c = html[i];
    if (c === '<') {
      const j = html.indexOf('>', i), tag = html.slice(i, j < 0 ? html.length : j + 1);
      cur += tag; i += tag.length;
      if (tag[1] === '/') depth = Math.max(0, depth - 1); else if (!/\/>$|^<(br|img|wbr|input|hr)\b/i.test(tag)) depth++;
      continue;
    }
    cur += c; i++;
    if (depth) continue;
    const rest = html.slice(i);
    const end = /[.!?…]/.test(c) ? /^(\s+)(?=[\p{Lu}\d%“"«¿¡(])/u.exec(rest) : c === ';' && cur.length > 30 ? /^(\s+)(?=\S[^<]{30})/u.exec(rest) : null;
    if (end) { out.push(c === ';' ? `${cur.slice(0, -1).trim()}.` : cur.trim()); cur = ''; i += end[1].length; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function bulletize(p) {
  if (p.querySelector(':scope > .bli')) return;
  let html = p.innerHTML.trim(), head = '';
  const m = /^<b>[\s\S]*?<\/b>/.exec(html);
  if (m) { head = m[0]; html = html.slice(m[0].length).replace(/^\s*[:;,.]?\s*/, ''); }
  const parts = sentencesOf(html);
  if (!parts.length || (!head && parts.length < 2)) return;
  const lang = document.documentElement.lang || 'en';
  const up = s => s.replace(/^\p{Ll}/u, ch => ch.toLocaleUpperCase(lang));
  p.innerHTML = (head ? `<span class="bhead">${head}</span> ` : '') + parts.map(s => `<span class="bli">${up(s)}</span>`).join(' ');
  p.classList.add('bullets');
}
const run = () => { for (const p of document.querySelectorAll('.doc article > p:not(.eyebrow):not(.lead):not(.fine):not(.docgo)')) bulletize(p); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();

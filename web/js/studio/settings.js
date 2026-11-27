// The picture studio's settings: what the visitor may change, kept on this device, and the two dialogs that go with
// them (the settings themselves, and the question asked before a large download).
const KEY = 'chrono-studio-set';
export const ASK_STEPS = [50, 100, 200, 300, 500, 700, 1000, 0];          // MB; 0 = never ask
export const MP_STEPS = [2.5, 4, 9, 16];                                  // million pixels
export const PREVIEWS = [['fast', 900], ['bal', 1300], ['sharp', 1800]];

export function defaults(phone) { return { ask: 200, askMobile: true, maxMP: phone ? 2.5 : 9, preview: phone ? 900 : 1300, heal: true }; }
export function load(phone) {
  const d = defaults(phone);
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (ASK_STEPS.includes(s.ask)) d.ask = s.ask; if (typeof s.askMobile === 'boolean') d.askMobile = s.askMobile;
    if (MP_STEPS.includes(s.maxMP)) d.maxMP = s.maxMP; if (PREVIEWS.some(p => p[1] === s.preview)) d.preview = s.preview; if (typeof s.heal === 'boolean') d.heal = s.heal;
  } catch { /* private mode, or a broken entry: the defaults */ }
  return d;
}
export function save(set) { try { localStorage.setItem(KEY, JSON.stringify(set)); } catch { /* private mode */ } }
export function forget() { try { localStorage.removeItem(KEY); } catch { /* private mode */ } }
/** Is this device on a phone line, or asked to save data? (Not every browser tells.) */
export const onMobileData = () => { const c = navigator.connection; return !!(c && (c.type === 'cellular' || c.saveData)); };
/** Must the visitor be asked before `bytes` are fetched? */
export function mustAsk(set, bytes) { return (set.askMobile && onMobileData()) || (set.ask > 0 && bytes > set.ask * 1e6); }

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
function dialog(id) {
  let d = document.getElementById(id);
  if (!d) { d = el('dialog', 'dlg'); d.id = id; document.body.append(d); d.addEventListener('click', e => { if (e.target === d) d.close('no'); }); }
  d.innerHTML = ''; return d;
}

/** "This picture needs about N MB": true if the visitor says go on. */
export function askFirst(T, fill, bytes) {
  return new Promise(done => {
    const d = dialog('askdlg'), mb = Math.max(1, Math.round(bytes / 1e6));
    d.append(el('h2', '', T.ask_title), el('p', '', fill(T.ask_text, { mb })));
    if (onMobileData()) d.append(el('p', 'warn', T.ask_mobile));
    d.append(el('p', 'fine', T.ask_hint));
    const row = el('div', 'rowbtns'), no = el('button', 'ghost', T.ask_no), go = el('button', 'cta', fill(T.ask_go, { mb }));
    no.type = go.type = 'button'; no.id = 'askno'; go.id = 'askgo'; no.onclick = () => d.close('no'); go.onclick = () => d.close('go'); row.append(no, go); d.append(row);
    d.addEventListener('close', () => done(d.returnValue === 'go'), { once: true });
    d.showModal(); go.focus();
  });
}

/**
 * The settings. `ctx`: { T, fill, lang, LANGS, set, phone, onChange(set), onLang(code), onGuide() }.
 * Every choice has a line under it that says, in a few words, what it does.
 */
export function openSettings(ctx) {
  const { T, fill, set } = ctx, d = dialog('setdlg');
  const head = el('div', 'dlghead'); head.append(el('h2', '', T.settings)); const x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', T.close); x.onclick = () => d.close(); head.append(x); d.append(head);
  const row = (label, hint, control) => { const r = el('div', 'setrow'), l = el('label', '', label), h = el('small', '', hint); control.id = control.id || `s${Math.random().toString(36).slice(2, 8)}`; l.htmlFor = control.id; r.append(l, control, h); d.append(r); return control; };
  const select = (opts, value, on) => { const s = el('select'); s.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join(''); s.value = String(value); s.onchange = () => on(s.value); return s; };
  const check = (value, on) => { const c = el('input'); c.type = 'checkbox'; c.checked = value; c.onchange = () => on(c.checked); return c; };
  const changed = () => { save(set); ctx.onChange(set); };
  row(T.set_lang, T.set_lang_d, select(Object.entries(ctx.LANGS), ctx.lang, v => ctx.onLang(v))).id = 'set_lang';
  row(T.set_ask, T.set_ask_d, select(ASK_STEPS.map(n => [n, n ? fill(T.set_mb, { n }) : T.set_never]), set.ask, v => { set.ask = +v; changed(); })).id = 'set_ask';
  const m = row(T.set_mobile, T.set_mobile_d, check(set.askMobile, v => { set.askMobile = v; changed(); })); m.id = 'set_mobile'; m.parentElement.classList.add('tick');
  row(T.set_max, T.set_max_d, select(MP_STEPS.map(n => [n, fill(T.set_mp, { n: String(n).replace('.', T.dec) })]), set.maxMP, v => { set.maxMP = +v; changed(); })).id = 'set_max';
  row(T.set_prev, T.set_prev_d, select(PREVIEWS.map(([k, n]) => [n, T['set_prev_' + k]]), set.preview, v => { set.preview = +v; changed(); })).id = 'set_prev';
  const h = row(T.set_heal, T.set_heal_d, check(set.heal, v => { set.heal = v; changed(); })); h.id = 'set_heal'; h.parentElement.classList.add('tick');
  d.append(el('p', 'fine setnote', T.set_note));
  const btns = el('div', 'rowbtns'), g = el('button', 'ghost small', T.set_guide), r = el('button', 'ghost small', T.set_reset);
  g.type = r.type = 'button'; g.id = 'set_guide'; r.id = 'set_reset';
  g.onclick = () => { d.close(); ctx.onGuide(); };
  r.onclick = () => { forget(); Object.assign(set, defaults(ctx.phone)); ctx.onChange(set); d.close(); openSettings(ctx); };
  btns.append(g, r); d.append(btns);
  d.showModal();
}

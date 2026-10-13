// ===== مكتبة المكونات (SCRUM-77) =====
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICONS = {
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10', book: 'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0', search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12', star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  file: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7', check: 'M20 6L9 17l-5-5',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01', chevD: 'M6 9l6 6 6-6',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z', clip: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
  grad: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5', menu: 'M3 6h18 M3 12h18 M3 18h18', shield: 'M12 2l7 3v6c0 5-3.5 8.8-7 11-3.5-2.2-7-6-7-11V5l7-3z M12 7v6 M12 18h.01',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 5a2 2 0 002 2h2a2 2 0 002-2', mega: 'M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1z M16 8a5 5 0 010 8',
};
const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[n]}"/></svg>`;
const badge = (t, tone = 'blue') => `<span class="badge ${tone}">${t}</span>`;
const pageHead = (title, sub, actions = '') => `<div class="head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div style="display:flex;gap:8px">${actions}</div></div>`;
const stat = (label, value, ic, tone) => `<div class="card"><div class="stat"><div class="ico ${tone}">${icon(ic, 20)}</div><div><b>${value}</b><small>${label}</small></div></div></div>`;

// حالات مشتركة: Skeleton / Empty / Error / Success
const skeleton = (n = 3, h = 64) => `<div class="grid" aria-busy="true">${Array.from({ length: n }, () => `<div class="sk" style="height:${h}px"></div>`).join('')}</div>`;
const stateBox = (tone, ic, title, body = '', action = '') => `<div class="state"><div class="ico ${tone}">${icon(ic, 26)}</div><b>${title}</b>${body}${action ? `<div style="margin-top:14px">${action}</div>` : ''}</div>`;
const empty = (title, body, ic = 'file', action) => stateBox('gray', ic, title, body, action);
const errorBox = (title = 'حدث خطأ، حاول مرة أخرى', body, action) => stateBox('red', 'alert', title, body, action);
const success = (title, body, action) => stateBox('green', 'check', title, body, action);
const placeholderPage = title => view => {
  view.innerHTML = pageHead(title) +
    `<div class="card">${empty('الصفحة دي هتتبني في مهمتها', 'الشيل والصلاحيات جاهزين، وتقدر تبدأ عليهم من غير ما تكتب مكونات جديدة.')}</div>`;
};

function tabs(el, list, active, onChange) {
  el.innerHTML = `<div class="tabs" role="tablist">${list.map(t => `<button role="tab" aria-selected="${t.id === active}" class="tab ${t.id === active ? 'on' : ''}" data-t="${t.id}">${t.label}</button>`).join('')}</div>`;
  el.querySelectorAll('.tab').forEach(b => b.onclick = () => onChange(b.dataset.t));
}

function modal(html, mount) {
  const bg = document.createElement('div'); bg.className = 'bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const k = e => e.key === 'Escape' && close();
  const close = () => { bg.remove(); document.removeEventListener('keydown', k); };
  document.addEventListener('keydown', k);
  bg.onmousedown = e => e.target === bg && close();
  document.body.appendChild(bg); mount && mount(bg.firstChild, close);
  return close;
}
function confirmDlg(o) {
  modal(`<h2>${o.title}</h2><p>${o.body}</p><div class="acts"><button class="btn ${o.danger ? 'danger' : 'primary'} ok">${o.label || 'تأكيد'}</button><button class="btn ghost no">إلغاء</button></div>`, (m, close) => {
    $('.ok', m).onclick = () => { close(); o.onOk(); };
    $('.no', m).onclick = () => { close(); o.onCancel && o.onCancel(); };
  });
}

// Field: label + محتوى + رسالة خطأ (id لازم عشان نحط فيه الخطأ)
const field = (label, inner, id = '') => `<div class="field"><label>${label}</label>${inner}<div class="e" id="e-${id}" role="alert"></div></div>`;
const setErr = (id, msg) => { const e = $('#e-' + id); if (e) e.textContent = msg || ''; };

function createDropdown(el, o) {
  let value = o.value || '', disabled = !!o.disabled, open = false;
  el.classList.add('dd');
  function draw() {
    const cur = o.options.find(x => x.value === value);
    el.innerHTML = `<button type="button" class="dd-b" ${disabled ? 'disabled' : ''} aria-haspopup="listbox" aria-expanded="${open}"><span style="${cur ? '' : 'color:var(--mut)'}">${esc(cur ? cur.label : o.placeholder || 'اختر')}</span>${icon('chevD', 15)}</button>${open ? `<div class="dd-m" role="listbox">${o.searchable ? '<input class="input dd-q" placeholder="بحث..." style="margin-bottom:6px">' : ''}<div class="dd-l"></div></div>` : ''}`;
    $('.dd-b', el).onclick = () => { open = !open; draw(); };
    if (open) {
      const list = $('.dd-l', el);
      const fill = q => {
        list.innerHTML = o.options.filter(x => x.label.includes(q)).map(x => `<button type="button" data-v="${x.value}" class="${x.value === value ? 'on' : ''}">${esc(x.label)}</button>`).join('');
        list.querySelectorAll('button').forEach(b => b.onclick = () => { open = false; const old = value; value = b.dataset.v; draw(); o.onChange && o.onChange(value, old); });
      };
      fill(''); const q = $('.dd-q', el); if (q) { q.focus(); q.oninput = () => fill(q.value); }
    }
  }
  document.addEventListener('mousedown', e => { if (open && el.isConnected && !el.contains(e.target)) { open = false; draw(); } });
  draw();
  return { get: () => value, set: v => { value = v; draw(); }, disable: d => { disabled = d; draw(); } };
}

function createTable(el, o) {
  const st = { q: '', f: '', p: 0 }, ps = o.pageSize || 8;
  el.innerHTML = `${o.search || o.filter ? `<div class="tools">${o.search ? `<input class="input t-q" style="flex:1;min-width:200px" placeholder="${o.search.placeholder}" aria-label="بحث">` : ''}${o.filter ? `<select class="select t-f" style="width:200px" aria-label="فلتر"><option value="">${o.filter.label}</option>${o.filter.options.map(x => `<option value="${x.value}">${x.label}</option>`).join('')}</select>` : ''}</div>` : ''}<div class="t-body"></div>`;
  const body = $('.t-body', el);
  function draw() {
    const data = o.rows.filter(r => (!o.search || !st.q || o.search.test(r, st.q)) && (!o.filter || !st.f || o.filter.test(r, st.f)));
    const pages = Math.max(1, Math.ceil(data.length / ps)); st.p = Math.min(st.p, pages - 1);
    const slice = data.slice(st.p * ps, (st.p + 1) * ps);
    if (!data.length) { body.innerHTML = o.empty || empty('لا توجد نتائج', 'جرّب تغيير البحث أو الفلتر.'); return; }
    body.innerHTML = `<div class="tw"><table><thead><tr>${o.cols.map(c => `<th>${c.title}</th>`).join('')}</tr></thead><tbody>${slice.map((r, i) => `<tr class="${o.onRow ? 'click' : ''}" data-i="${i}">${o.cols.map(c => `<td>${c.render(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="pager"><span>${data.length} نتيجة · صفحة ${st.p + 1} من ${pages}</span><div><button data-p="${st.p - 1}" ${st.p === 0 ? 'disabled' : ''} aria-label="السابق">›</button>${Array.from({ length: pages }, (_, i) => `<button data-p="${i}" class="${i === st.p ? 'on' : ''}">${i + 1}</button>`).join('')}<button data-p="${st.p + 1}" ${st.p === pages - 1 ? 'disabled' : ''} aria-label="التالي">‹</button></div></div>`;
    body.querySelectorAll('.pager button').forEach(b => b.onclick = () => { st.p = +b.dataset.p; draw(); });
    if (o.onRow) body.querySelectorAll('tr.click').forEach(tr => tr.onclick = e => { if (!e.target.closest('input,button,a')) o.onRow(slice[+tr.dataset.i]); });
    o.onRender && o.onRender(body);
  }
  const q = $('.t-q', el), f = $('.t-f', el);
  if (q) q.oninput = () => { st.q = q.value; st.p = 0; draw(); };
  if (f) f.onchange = () => { st.f = f.value; st.p = 0; draw(); };
  draw();
  return { redraw: draw };
}

function createUpload(el, o) {
  let file = null, err = '', disabled = !!o.disabled;
  function choose(f) {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!o.exts.includes(ext)) { err = `نوع الملف غير مدعوم. المسموح: ${o.exts.join(' / ').toUpperCase()}`; return draw(); }
    if (f.size > o.maxMB * 1048576) { err = `حجم الملف أكبر من ${o.maxMB}MB`; return draw(); }
    err = ''; file = f; draw(); o.onPick && o.onPick(f);
  }
  function draw() {
    el.innerHTML = `<div class="drop ${disabled ? 'off' : file ? 'ok' : err ? 'err' : ''}">${icon(file ? 'check' : 'upload', 28)}<div style="font-weight:700;margin:8px 0 2px">${file ? esc(file.name) : 'اسحب الملف هنا أو اختره من جهازك'}</div><div style="font-size:11px;color:var(--mut)">${o.exts.join(' / ').toUpperCase()} · حتى ${o.maxMB}MB</div>
      <label class="btn outline" style="margin-top:12px;${disabled ? 'opacity:.5;pointer-events:none' : ''}">${file ? 'تغيير الملف' : 'اختيار ملف'}<input type="file" hidden accept="${o.exts.map(e => '.' + e).join(',')}"></label>${file ? '<button type="button" class="btn ghost u-rm" style="margin:12px 8px 0 0">إزالة</button>' : ''}${err ? `<div role="alert" style="color:var(--bad);font-size:12px;margin-top:8px">${err}</div>` : ''}</div>`;
    const d = $('.drop', el);
    $('input', el).onchange = e => choose(e.target.files[0]);
    d.ondragover = e => e.preventDefault(); d.ondrop = e => { e.preventDefault(); !disabled && choose(e.dataTransfer.files[0]); };
    const rm = $('.u-rm', el); if (rm) rm.onclick = () => { file = null; draw(); o.onPick && o.onPick(null); };
  }
  draw();
  return { get: () => file, disable: d => { disabled = d; draw(); }, clear: () => { file = null; err = ''; draw(); } };
}

// يلغي أي تايمر قديم لو المستخدم غيّر الصفحة
let routeToken = 0;
const live = fn => { const t = routeToken; return (...a) => t === routeToken && fn(...a); };

((q, year, pickOnly, other) => {
  // Both TMDB names travel with the title. Normalize both names and visible site text alike.
  const norm = s => (s || '').toLowerCase().normalize('NFKD').replace(/\u0640|\p{M}/gu, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6f0))
    .replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim();
  const wanted = [...new Set([q, other].map(norm).filter(Boolean))];
  if (!wanted.length) return;
  const pick = () => {
    let best = null, top = 0;
    for (const a of document.querySelectorAll('a[href]')) {
      const r = a.getBoundingClientRect();
      if (r.width < 20 || r.height < 14 || a.href === location.href || /^(javascript:|#)/.test(a.getAttribute('href')) || /\/search\b|[?&](q|s|query|keyword)=/i.test(a.href)) continue;
      const texts = [a.innerText, a.title, a.getAttribute('aria-label')].concat([...a.querySelectorAll('img')].map(i => i.alt));
      for (const t of texts) {
        if (!t) continue;
        const first = norm(String(t).split('\n')[0]), all = norm(t);
        let s = wanted.includes(first) ? 4 : wanted.some(w => first.startsWith(w + ' ') && /^\d{4}$/.test(first.slice(w.length).trim())) ? 3 : 0;
        const years = all.match(/\b(?:19|20)\d{2}\b/g) || [];
        if (s && year && years.length && !years.includes(year)) s = 0;
        if (s && year && years.includes(year)) s++;
        if (s > top) { top = s; best = a; }
      }
    }
    return top ? best : null;
  };
  const open = a => {
    if (window.AnantPlay && AnantPlay.picked) AnantPlay.picked();
    const before = location.href; a.click();
    setTimeout(() => { if (location.href === before) location.href = a.href; }, 1200);
  };
  let retried = false;
  const type = text => {
    const visible = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 30 && r.height > 12 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const label = e => [e.placeholder, e.name, e.id, e.getAttribute('aria-label'), e.title, typeof e.className == 'string' ? e.className : ''].join(' ');
    const i = [...document.querySelectorAll('input')].find(e => !/^(hidden|checkbox|radio|button|submit|file|password|email|number|date)$/.test(e.type) && visible(e) && (e.type === 'search' || /search|find|title|movie|show|query|\bq\b/i.test(label(e))));
    if (!i) return false;
    i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, text);
    i.dispatchEvent(new Event('input', {bubbles:true})); i.dispatchEvent(new Event('change', {bubbles:true}));
    if (i.form) i.form.acceptCharset = 'UTF-8';
    ['keydown','keypress','keyup'].forEach(k => i.dispatchEvent(new KeyboardEvent(k,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true})));
    if (i.form && i.form.requestSubmit) try { i.form.requestSubmit(); } catch(e) {}
    if (window.AnantPlay && AnantPlay.searched) AnantPlay.searched();
    return true;
  };
  const openSearch = () => {
    const label = e => [e.placeholder, e.name, e.id, e.getAttribute('aria-label'), e.title, typeof e.className == 'string' ? e.className : ''].join(' ');
    const b = [...document.querySelectorAll('button,a,[role=button],svg,div,span')].find(e => /search/i.test(label(e)) && e.children.length < 6);
    if (b) (b.closest('button,a,[role=button]') || b).click();
  };
  const watch = () => {
    let k = 0;
    const timer = setInterval(() => {
      const a = pick();
      if (a) { clearInterval(timer); open(a); return; }
      if (++k > 80) {
        clearInterval(timer);
        if (!retried && other && norm(other) !== norm(q)) {
          retried = true;
          let tries = 0;
          const retryTimer = setInterval(() => {
            if (type(other)) { clearInterval(retryTimer); watch(); }
            else if (++tries === 2) openSearch();
            else if (tries > 40) { clearInterval(retryTimer); window.__fpQ = null; }
          }, 300);
        }
      }
    }, 500);
  };
  if (pickOnly) { watch(); return; }
  if (window.__fpQ === q) return;
  window.__fpQ = q;
  const now = pick(); if (now) { if (window.AnantPlay) AnantPlay.searched(); open(now); return; }
  watch();
  let n = 0;
  const timer = setInterval(() => {
    const field = [...document.querySelectorAll('input')].some(i => i.type === 'search' || /search|find|title|movie|show|query/i.test([i.placeholder,i.name,i.id].join(' ')));
    if (field && type(q)) clearInterval(timer);
    else if (n === 6) openSearch();
    if (++n > 40) { clearInterval(timer); if (!other && window.__fpQ === q) window.__fpQ = null; }
  }, 300);
})

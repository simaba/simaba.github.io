(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const savedTheme = (() => { try { return localStorage.getItem('simaba-theme'); } catch { return null; } })();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    try { localStorage.setItem('simaba-theme', theme); } catch { /* Storage is optional. */ }
  }
  applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (prefersDark ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  const menuButton = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  function closeMenu() { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); menuButton.querySelector('span').textContent = '☰'; }
  menuButton.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuButton.querySelector('span').textContent = open ? '×' : '☰';
  });
  for (const link of nav.querySelectorAll('a')) link.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
  const filters = [...document.querySelectorAll('[data-filter]')];
  const rows = [...document.querySelectorAll('.project-row')];
  const search = document.getElementById('project-search');
  const resultCount = document.getElementById('result-count');
  const empty = document.getElementById('empty-results');
  let type = 'all';
  function update() {
    const q = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const row of rows) {
      const matches = (type === 'all' || row.dataset.kind === type) && (q === '' || row.dataset.search.includes(q));
      row.hidden = !matches;
      if (matches) visible++;
    }
    resultCount.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}`;
    empty.hidden = visible !== 0;
  }
  for (const filter of filters) filter.addEventListener('click', () => {
    type = filter.dataset.filter;
    for (const item of filters) {
      const active = item === filter;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    }
    update();
  });
  search.addEventListener('input', update);
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();


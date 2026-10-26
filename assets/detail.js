(() => {
  'use strict';
  const root=document.documentElement, toggle=document.getElementById('theme-toggle');
  let saved=null;
  try { saved=localStorage.getItem('simaba-theme'); } catch {}
  const preferred=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  function apply(theme){
    root.dataset.theme=theme;
    toggle.setAttribute('aria-label','Switch to '+(theme==='dark'?'light':'dark')+' mode');
    toggle.setAttribute('aria-pressed',String(theme==='dark'));
    try {localStorage.setItem('simaba-theme',theme)} catch {}
  }
  apply(saved==='light'||saved==='dark'?saved:preferred);
  toggle.addEventListener('click',()=>apply(root.dataset.theme==='dark'?'light':'dark'));
})();

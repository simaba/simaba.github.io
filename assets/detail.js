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
  const menu=document.getElementById('menu-toggle'),nav=document.getElementById('primary-nav');
  if(menu&&nav){
    function close(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.querySelector('span').textContent='☰';}
    menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.querySelector('span').textContent=open?'×':'☰';});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){close();menu.focus();}});
    for(const link of nav.querySelectorAll('a'))link.addEventListener('click',close);
  }
})();

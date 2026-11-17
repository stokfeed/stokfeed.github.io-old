/* Stokfeed v16: optional motion only; no network calls or changes to publishing. */
(() => {
  'use strict';
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sameOrigin = (link) => {
    try { return new URL(link.href, location.href).origin === location.origin; }
    catch { return false; }
  };
  // Cross-document view transitions are defined in CSS. The JS fallback
  // applies only to browsers without the View Transition API.
  const nativeTransitions = !!(window.CSS && CSS.supports && CSS.supports('view-transition-name', 'root'));
  let leaving = false;
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || leaving || reduceMotion() || nativeTransitions || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self') ||
        !sameOrigin(link) || link.hasAttribute('data-no-transition')) return;
    let destination;
    try { destination = new URL(link.href, location.href); } catch { return; }
    if (!/^https?:$/.test(destination.protocol) ||
        (destination.pathname === location.pathname && destination.search === location.search)) return;
    event.preventDefault();
    leaving = true;
    document.documentElement.classList.add('sf-leaving');
    window.setTimeout(() => { location.assign(destination.href); }, 145);
  });
  // Back/forward cache must always restore the original, interactive UI.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      leaving = false;
      document.documentElement.classList.remove('sf-leaving');
    }
  });

  // Animate just the cards inserted by the dynamic archive fallback.
  // Existing server-rendered cards stay fully visible and indexable.
  const animateInserted = (nodes) => {
    if (reduceMotion()) return;
    for (const node of nodes) {
      if (!(node instanceof Element)) continue;
      const candidates = node.matches('.story') ? [node] : [...node.querySelectorAll('.story')];
      for (const card of candidates) {
        card.classList.add('sf-new-card');
        card.addEventListener('animationend', () => card.classList.remove('sf-new-card'), {once:true});
      }
    }
  };
  const attach = () => {
    const archives = document.querySelectorAll('[data-stokfeed-live-desk]');
    if (!archives.length) return;
    for (const archive of archives) {
      const observer = new MutationObserver((records) => {
        for (const record of records) animateInserted(record.addedNodes);
      });
      observer.observe(archive, {childList:true, subtree:true});
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, {once:true});
  else attach();
})();

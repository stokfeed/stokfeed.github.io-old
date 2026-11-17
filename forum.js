/* Stokfeed forum pre-stage. Strict parameter validation; no thread creation or hidden data. */
(() => {
  'use strict';
  const container = document.getElementById('forum-article-context');
  if (!container) return;
  const q = new URLSearchParams(location.search);
  const desk = q.get('desk');
  const id = q.get('article');
  const desks = new Set(['nyse', 'qqq', '4x', 'crypto', 'tsx', 'lse', 'euronext', 'asx', 'jpx', 'research']);
  const idPattern = /^(?:stocks|qqq|forex|crypto|tsx|lse|euronext|asx|jpx)-\d{4}-\d{2}-\d{2}$|^post-\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,90}$/;
  if (!desk || !id || !desks.has(desk) || !idPattern.test(id)) return;
  const board = ({nyse:'stocks',qqq:'stocks','4x':'forex',crypto:'crypto',tsx:'stocks',lse:'stocks',euronext:'stocks',asx:'stocks',jpx:'stocks',research:'research'})[desk];
  const text = (tag, value, cls) => { const el = document.createElement(tag); el.textContent=value; if(cls)el.className=cls; return el; };
  const anchor = (label, href) => { const a=document.createElement('a'); a.textContent=label;a.href=href; a.className='button';return a;};
  container.hidden = false;
  container.append(text('p','Related article','kicker'),text('h2','Retrieving the article…'));
  fetch(`https://zeos.stokfeed.us/v1/forum/articles/${encodeURIComponent(desk)}/${encodeURIComponent(id)}`, {headers:{Accept:'application/json'}})
    .then(async r => {const data=await r.json();if(!r.ok)throw Error(data.error||'Article unavailable');return data;})
    .then(data => {
      container.replaceChildren(text('p','Related article','kicker'),text('h2',data.article.title),text('p',data.article.summary));
      const links=document.createElement('div');links.className='forum-context-links';
      links.append(anchor('Read full article',data.article.url),anchor('Explore board',`#board-${board}`));
      container.append(links,text('p','Article-linked threads are not yet enabled. Use the article page for bull/bear reactions and structured comments.','note'));
    })
    .catch(() => {container.replaceChildren(text('h2','Related article unavailable'),text('p','You can still browse the market boards below.'));});
})();

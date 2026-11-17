/* Stokfeed: static GitHub Pages + public Zeos API. No build process or credentials. */
(()=>{
'use strict';
const API='https://zeos.stokfeed.us/v1';
const DESKS=new Set(['nyse','qqq','4x','crypto','tsx','lse','euronext','asx','jpx']);
const ALLOWED=new Set([...DESKS,'research']);
const IDENT=/^[a-z0-9][a-z0-9-]{0,129}$/;
const labels={nyse:'NYSE & S&P 500',qqq:'QQQ','4x':'Forex',crypto:'Crypto',tsx:'TSX & Canada',lse:'London Markets',euronext:'Euronext',asx:'ASX & Australia',jpx:'Japan Markets',research:'Research & Opinion'};
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
const humanDate=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';return value;};
const articleUrl=(desk,id)=>`/article.html?desk=${encodeURIComponent(desk)}&id=${encodeURIComponent(id)}`;
const fetchJson=async(url,timeout=12000)=>{
 const ctrl=new AbortController();const stop=setTimeout(()=>ctrl.abort(),timeout);
 try{const response=await fetch(url,{signal:ctrl.signal,credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
 if(!response.ok)throw Error(`Zeos returned HTTP ${response.status}`);
 const json=await response.json();if(!json||typeof json!=='object')throw Error('Invalid Zeos response');return json;
 }finally{clearTimeout(stop);}
};
const normalize=(a,desk)=>{
 if(!a||typeof a!=='object'||typeof a.id!=='string'||!IDENT.test(a.id)||typeof a.title!=='string'||!a.title.trim())return null;
 return {desk,id:a.id,title:a.title.trim(),summary:typeof a.summary==='string'?a.summary:'',date:humanDate(a.date),author:typeof a.author==='string'?a.author:'Stokfeed Markets'};
};
const makeCard=(a)=>{
 const card=make('article','story'); const kicker=make('div','kicker',labels[a.desk]);const heading=make('h3');
 const link=make('a',null,a.title);link.href=articleUrl(a.desk,a.id);heading.append(link);
 const summary=make('p',null,a.summary||'Read the market report and quantitative analysis.');
 const meta=make('div','meta',`${a.date||'Market report'} · ${a.author}`);card.append(kicker,heading,summary,meta);return card;
};
const state=new Map();
async function load(section,more=false){
 const desk=section.dataset.stokfeedLiveDesk;if(!DESKS.has(desk))return;
 const container=section.querySelector('.story-grid, .archive');if(!container)return;
 const isHome=section.classList.contains('section');const limit=isHome?4:24;
 const current=state.get(section)||{offset:0,items:[],done:false,busy:false};if(current.busy||current.done&&more)return;
 current.busy=true;state.set(section,current);
 let info=section.querySelector('[data-feed-status]');if(!info){info=make('p','sf-feed-status');info.dataset.feedStatus='';section.append(info);}
 info.textContent='Loading market reports…';
 try{
  const response=await fetchJson(`${API}/${desk}/articles?limit=${limit}&offset=${more?current.offset:0}`);
  if(!Array.isArray(response.articles))throw Error('Zeos returned no article list');
  const articles=response.articles.map(x=>normalize(x,desk)).filter(Boolean);
  if(!more){current.items=[];current.offset=0;container.replaceChildren();}
  const existing=new Set(current.items.map(a=>a.id));for(const a of articles){if(existing.has(a.id))continue;existing.add(a.id);current.items.push(a);container.append(makeCard(a));}
  current.offset+=response.articles.length;
  current.done=response.hasMore===false||response.articles.length<limit||Number.isFinite(response.total)&&current.offset>=response.total;
  if(!current.items.length){container.append(make('p','note','No reports have been returned for this market yet.'));}
  info.textContent=current.items.length?`${current.items.length} report${current.items.length===1?'':'s'} loaded`:'';
  const old=section.querySelector('[data-load-more]');if(old)old.remove();
  if(!isHome&&!current.done){const button=make('button','button','Load more reports');button.type='button';button.dataset.loadMore='';button.addEventListener('click',()=>load(section,true));section.append(button);}
 }catch(err){
  const message=err.name==='AbortError'?'Zeos did not respond in time.':'Market feed temporarily unavailable.';
  info.replaceChildren(make('span',null,message+' '));
  const retry=make('button','sf-retry','Retry');retry.type='button';retry.addEventListener('click',()=>load(section,more));info.append(retry);
  if(!more&&!current.items.length){container.replaceChildren(make('p','note','Existing market articles remain stored in Zeos. Please retry this category.'));}
  console.warn('Stokfeed archive:',desk,err);
 }finally{current.busy=false;}
}
// Deliberately format Markdown with text nodes, not arbitrary HTML from the API.
function bodyMarkdown(source,root){
 const lines=String(source||'').replace(/\r/g,'').split('\n');let paragraph=[],bullets=[];
 const inline=(target,text)=>{const chunks=String(text).split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^)]+\))/g);
 for(const chunk of chunks){if(/^\*\*[^*]+\*\*$/.test(chunk)){target.append(make('strong',null,chunk.slice(2,-2)));}
 else{const match=chunk.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);if(match){const a=make('a',null,match[1]);a.href=match[2];a.rel='noopener noreferrer';a.target='_blank';target.append(a);}else target.append(document.createTextNode(chunk));}}};
 const flushP=()=>{if(paragraph.length){const p=make('p');inline(p,paragraph.join(' '));root.append(p);paragraph=[];}};
 const flushList=()=>{if(bullets.length){const ul=make('ul');bullets.forEach(t=>{const li=make('li');inline(li,t);ul.append(li);});root.append(ul);bullets=[];}};
 for(const line of lines){const s=line.trim();if(!s){flushP();flushList();continue;}
 const head=s.match(/^(#{1,4})\s+(.+)$/);if(head){flushP();flushList();const h=make(head[1].length<3?'h2':'h3');inline(h,head[2]);root.append(h);continue;}
 const item=s.match(/^[-*]\s+(.+)$/);if(item){flushP();bullets.push(item[1]);continue;}
 flushList();paragraph.push(s);}
 flushP();flushList();
}
async function showArticle(){
 const host=document.getElementById('sf-article-detail');if(!host)return;
 const params=new URLSearchParams(location.search),desk=params.get('desk'),id=params.get('id');
 if(!ALLOWED.has(desk)||!IDENT.test(id||'')){host.replaceChildren(make('h1',null,'Article not found'),make('p',null,'Choose an article from the market archives.'));return;}
 host.replaceChildren(make('p','note','Loading article…'));
 try{
 const a=await fetchJson(`${API}/${desk}/articles/${encodeURIComponent(id)}`);
 if(a.id!==id||typeof a.title!=='string')throw Error('Unexpected article response');
 const article=make('article','article');const kicker=make('div','kicker',labels[desk]);const title=make('h1',null,a.title);
 const dek=make('p','dek',typeof a.summary==='string'?a.summary:'');
 const meta=make('div','meta',`${humanDate(a.date)} · ${a.author||'Stokfeed Markets'}`);
 const body=make('div','body');bodyMarkdown(a.body||'',body);
 if(!body.childNodes.length)body.append(make('p',null,'Article text is temporarily unavailable.'));
 article.append(kicker,title,dek,meta,body);
 if(typeof a.source==='string'&&a.source)article.append(make('p','source',`Sources: ${a.source}`));
 const discussion=make('aside','discussion-cta');discussion.append(make('h2',null,'Community discussion'),make('p',null,'Discuss this analysis and share a bullish or bearish market view.'));
 const board=make('a','button','Explore related forum board');board.href=`/forums.html?desk=${encodeURIComponent(desk)}&article=${encodeURIComponent(id)}`;discussion.append(board);article.append(discussion);
 const social=make('section','social-section');social.id='stokfeed-social';social.dataset.desk=desk;social.dataset.articleId=id;article.append(social);
 host.replaceChildren(article);document.title=`${a.title} | Stokfeed`;
 // The social script initializes after its container is inserted.
 const script=document.createElement('script');script.src='/social.js';script.async=true;document.body.append(script);
 }catch(err){console.warn('Article load failed:',err);host.replaceChildren(make('h1',null,'Unable to load report'),make('p',null,'Zeos could not supply this article right now. Your browser can retry without rebuilding the website.'));
 const retry=make('button','button','Retry article');retry.type='button';retry.addEventListener('click',showArticle);host.append(retry);}
}
function start(){document.querySelectorAll('[data-stokfeed-live-desk]').forEach(section=>{void load(section);});void showArticle();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

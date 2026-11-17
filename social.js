/* Stokfeed bull/bear article reactions and rule-based market comments.
   Requires zeos SOCIAL_SALT; no CAPTCHA or Turnstile keys.
   Uses textContent for all user-supplied data. */
(() => {
  'use strict';
  const node = document.getElementById('stokfeed-social');
  if (!node) return;
  const desk = node.dataset.desk;
  const articleId = node.dataset.articleId;
  if (!/^(nyse|qqq|4x|crypto|tsx|lse|euronext|asx|jpx|research)$/.test(desk) || !/^[a-z0-9-]{3,130}$/.test(articleId)) return;
  const endpoint = `https://zeos.stokfeed.us/v1/social/${encodeURIComponent(desk)}/${encodeURIComponent(articleId)}`;
  const typeForDesk = desk === 'crypto' ? 'crypto' : (desk === '4x' || ['tsx','lse','euronext','asx','jpx'].includes(desk)) ? 'forex' : 'stock';
  const icon = (kind) => kind === 'bullish' ?
    '<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M3 7 1 3l8 3 4 4h6l4-4 8-3-2 8-4 3 1 7-4 5h-4l-2-4-2 4H9l-4-5 1-7-3-3Zm8 9a2 2 0 1 0 0 .1Zm12 0a2 2 0 1 0 0 .1ZM12 23h8l-4-4Z"/></svg>' :
    '<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M5 4 2 10l4 4-2 6 4 8h16l4-8-2-6 4-4-3-6-5 5-6-2-6 2ZM9 15l6 2-5 2Zm14 0-1 4-5-2Zm-11 9h8l-4-3Z"/></svg>';
  const el = (tag, props={}) => { const v=document.createElement(tag);for(const [k,value] of Object.entries(props)){if(k==='text')v.textContent=value;else if(k==='className')v.className=value;else if(k==='html')v.innerHTML=value;else v.setAttribute(k,value);}return v; };
  const heading=el('h2',{text:'Market sentiment'});const description=el('p',{text:'Bullish or bearish? Share a structured market view. Sentiment is reader opinion, not a trading signal.'});
  const votes=el('div',{className:'social-votes'});
  const bull=el('button',{type:'button',className:'social-vote social-bull',html:icon('bullish')+'<span>Bull <strong>0</strong></span>'});
  const bear=el('button',{type:'button',className:'social-vote social-bear',html:icon('bearish')+'<span>Bear <strong>0</strong></span>'});
  bull.setAttribute('aria-label','React bullish');bear.setAttribute('aria-label','React bearish');
  votes.append(bull,bear);
  const status=el('p',{className:'social-status','role':'status','aria-live':'polite'});
  const title=el('h3',{text:'Add your market view'});
  const form=el('form',{className:'social-form'});
  const label=(text,control)=>{const box=el('label');box.append(el('span',{text}),control);return box;};
  const name=el('input',{type:'text',maxLength:'30',placeholder:'Display name',value:'Reader',autocomplete:'nickname'});
  const type=el('select');
  [['stock','Stock / ETF'],['crypto','Cryptocurrency'],['forex','Currency pair']].forEach(([v,t])=>{const option=el('option',{value:v,text:t});type.append(option);});
  type.value=typeForDesk;if(desk!=='research'&&!['tsx','lse','euronext','asx','jpx'].includes(desk))type.disabled=true;
  const symbol=el('input',{type:'text',maxLength:'25',required:'',placeholder:(desk==='4x'||['tsx','lse','euronext','asx','jpx'].includes(desk))?'USD/CAD':desk==='crypto'?'BTC':'AAPL',pattern:'[A-Za-z0-9./-]+'});
  const stance=el('select');[['bullish','Bullish'],['bearish','Bearish']].forEach(([v,t])=>stance.append(el('option',{value:v,text:t})));
  const reason=el('select');
  const note=el('textarea',{rows:'3',maxLength:'300',placeholder:'Optional explanation (reviewed before publishing; no links)'});
  const send=el('button',{type:'submit',className:'social-submit',text:'Post market view'});
  form.append(label('Name',name),label('Asset type',type),label('Ticker, token, or currency pair',symbol),label('Outlook',stance),label('Reason',reason),label('Optional comment',note),send);
  const commentsHeader=el('h3',{text:'Community outlook'}), comments=el('div',{className:'social-comments'});
  node.replaceChildren(heading,description,votes,status,title,form,commentsHeader,comments);
  let cfg=null;
  const request=async(url,init)=>{const r=await fetch(url,{...init,headers:{Accept:'application/json',...(init?.headers||{})}});const body=await r.json();if(!r.ok)throw Error(body.error||'Request failed');return body;};
  const showError=err=>{status.textContent=err.message==='slow_down'?'Please wait before posting another comment.':err.message==='social_not_configured'?'Community posting is not configured yet.':`Unable to submit: ${err.message}`;};
  function renderReason(){reason.replaceChildren();(cfg?.reasons?.[stance.value]||[]).forEach(v=>reason.append(el('option',{value:v,text:cfg.reasonLabels[v]||v})));}
  stance.addEventListener('change',renderReason);
  async function refresh(){
    try{
      const [r,c]=await Promise.all([request(endpoint+'/reactions'),request(endpoint+'/comments')]);
      bull.querySelector('strong').textContent=String(r.bullish);bear.querySelector('strong').textContent=String(r.bearish);
      bull.setAttribute('aria-pressed',String(r.own==='bullish'));bear.setAttribute('aria-pressed',String(r.own==='bearish'));
      comments.replaceChildren();
      if(!c.comments.length)comments.append(el('p',{text:'No community opinions yet.'}));
      for(const x of c.comments){
        const card=el('article',{className:`social-comment ${x.stance==='bullish'?'is-bull':'is-bear'}`});
        const meta=el('p',{className:'social-comment-meta',text:`${x.name} · ${x.stance==='bullish'?'🐂 Bullish':'🐻 Bearish'} on ${x.symbol} · ${new Date(x.createdAt).toLocaleDateString()}`});
        card.append(meta,el('p',{text:x.reasonLabel||x.reason}));
        if(x.note)card.append(el('p',{text:x.note}));comments.append(card);
      }
    }catch(e){showError(e);}
  }
  async function post(action,data){
    if(!cfg?.enabled){status.textContent='Community posting is not configured yet.';return;}
    status.textContent='Submitting…';
    try{
      const result=await request(endpoint+'/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      status.textContent=result.message||(action==='reactions'?'Sentiment saved.':'Comment received.');
      if(action==='comments'){note.value='';}await refresh();
    }catch(e){showError(e);}
  }
  bull.addEventListener('click',()=>post('reactions',{stance:'bullish'}));
  bear.addEventListener('click',()=>post('reactions',{stance:'bearish'}));
  form.addEventListener('submit',event=>{
    event.preventDefault();const sym=symbol.value.trim().toUpperCase();
    post('comments',{name:name.value.trim()||'Reader',assetType:type.value,symbol:sym,stance:stance.value,reason:reason.value,note:note.value.trim()});
  });
  (async()=>{
    await refresh();
    try{
      cfg=await request('https://zeos.stokfeed.us/v1/social/config');renderReason();
      if(!cfg.enabled){send.disabled=true;bull.disabled=true;bear.disabled=true;status.textContent='Posting will be enabled when the Worker social secret is configured.';return;}
    }catch(e){send.disabled=true;showError(e);}
  })();
})();

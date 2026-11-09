/* ==================== UI KIT ====================
   One shared set of window behaviours for every page of the project: the game (the build inlines this file into index.html and the editor),
   the beta feedback windows (beta/feedback.js runs inside the game and uses window.UIK), the beta dashboard (beta/feedback.html) and the
   preview prototypes (preview/*.html load ../src/ui/kit.js). New windows are built on it — never with default behaviour:
   - no scrollbars anywhere (the kit's stylesheet hides them on the whole page);
   - UIK.drag — drag to scroll: the middle mouse button anywhere over a scroller, the left button (mouse, pen) where the page allows it,
     a finger pans natively; a coast after a fast release; the click that ends a drag is swallowed;
   - UIK.edges — arrows at the edges of a scroller that has more content past them (a tap scrolls most of a page), UIK.more — the same state
     on edge markers the page draws itself (.more.up / .more.dn next to the scroller);
   - UIK.tap — touch taps act on pointerup (a mobile browser drops the click of a tap that stops a fling, is held a little long or lands
     while the main thread is busy); the native click that follows is swallowed;
   - UIK.popup — a popup / menu closes when the mouse goes more than 25 px outside it, on Esc and on a press outside;
   - UIK.modal — a modal window: keys stay inside, Esc and a tap on the backdrop close it, focus returns where it was.
   Not a module: the file declares one name (UIK) and also puts it on window, so it works as a classic script and inside the game's cubeMain. */
const UIK=(()=>{
  if(typeof window!=='undefined' && window.UIK) return window.UIK;        // loaded twice (a tool page that also pulls the game in): one kit
  const D=document, now=()=>performance.now();
  const css=D.createElement('style'); css.id='uikCss';
  css.textContent=`
  *{scrollbar-width:none}
  *::-webkit-scrollbar{display:none;width:0;height:0}
  .uk-scr{overflow:auto;overscroll-behavior:contain;touch-action:pan-y}
  .uk-drag,.uk-drag *{cursor:grabbing!important;user-select:none!important}
  .uk-mol{position:absolute;inset:0;pointer-events:none}
  .uk-mo{position:absolute;z-index:var(--z,4);width:30px;height:18px;border:1px solid var(--uk-line,rgba(255,255,255,.25));border-radius:9px;background:var(--uk-bg,rgba(36,26,67,.9));color:var(--uk-fg,#ffd36b);display:grid;place-items:center;padding:0;margin:0;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .2s;box-shadow:0 2px 8px rgba(0,0,0,.45)}
  .uk-mo.on{opacity:1;pointer-events:auto}
  .uk-mo.l,.uk-mo.r{width:18px;height:26px}
  .uk-mo svg{width:12px;height:12px}
  .uk-mo.d svg{transform:rotate(180deg)} .uk-mo.l svg{transform:rotate(-90deg)} .uk-mo.r svg{transform:rotate(90deg)}`;
  (D.head||D.documentElement).prepend(css);                              // first: every page's own rules win over the kit's defaults

  /* ==== SCROLLERS ==== */
  const scrP=ax=>ax==='y' ? 'scrollTop' : 'scrollLeft', scrMax=(el,ax)=>ax==='y' ? el.scrollHeight-el.clientHeight : el.scrollWidth-el.clientWidth;
  function scrollable(el,ax){
    if(!el || el.nodeType!==1 || scrMax(el,ax)<2) return false;
    const o=getComputedStyle(el)[ax==='y' ? 'overflowY' : 'overflowX'];
    return o==='auto' || o==='scroll' || el===D.scrollingElement && o!=='hidden';
  }
  /* The nearest ancestor of t that scrolls along ax (null — none) */
  function scrOf(t,ax){ for(let el=t && t.nodeType===1 ? t : t && t.parentElement; el; el=el.parentElement) if(scrollable(el,ax)) return el; return null; }

  /* ==== DRAG TO SCROLL ====
     One set of document listeners for the whole page; they do work only while a drag is live. UIK.drag.set(opts) tunes it for the page:
     left(t, e)     → the scroller a left-button (mouse/pen) drag from t moves, or null (default: the nearest scroller unless t is a field — FIELDS);
     middle         → false turns the middle button off (default: on, anywhere over a scroller);
     cancel(sc,dx,dy) → true when the first move should be left to the page (a sideways pager), the drag is dropped;
     start(sc), end(sc, moved) → hooks (the game clears its long press, swallows its own clicks). */
  const FIELDS='input,textarea,select,audio,video,[contenteditable],[contenteditable] *,.bs,[data-nodrag],[data-nodrag] *';
  const DRAG_MOVE=5;
  const DR={ left:(t)=>t.closest && t.closest(FIELDS) ? null : scrOf(t,'y')||scrOf(t,'x'), middle:true, cancel:null, start:null, end:null, coast:true };
  let drg=null, coast=0, eatClick=0;
  function coastStop(){ if(coast){ cancelAnimationFrame(coast); coast=0; } }
  function coastGo(sc,vx,vy){
    coastStop(); if(Math.hypot(vx,vy)<.12) return;
    let lt=0;
    const step=t=>{ const dt=lt ? Math.min(.05,(t-lt)/1000) : .016; lt=t;
      sc.scrollTop-=vy*dt*1000; sc.scrollLeft-=vx*dt*1000;
      const k=Math.exp(-dt*5.2); vx*=k; vy*=k;
      if(Math.hypot(vx,vy)<.04 || !sc.isConnected){ coast=0; return; }
      coast=requestAnimationFrame(step); };
    coast=requestAnimationFrame(step);
  }
  D.addEventListener('mousedown',e=>{ if(e.button===1 && DR.middle && (scrOf(e.target,'y')||scrOf(e.target,'x'))) e.preventDefault(); },true);   // no browser autoscroll
  D.addEventListener('pointerdown',e=>{
    coastStop(); drg=null;
    if(e.pointerType==='touch') return;
    let sc=null;
    if(e.button===1 && DR.middle) sc=scrOf(e.target,'y')||scrOf(e.target,'x');
    else if(e.button===0 && DR.left) sc=DR.left(e.target,e);
    if(!sc) return;
    if(e.button===1) e.preventDefault();
    drg={ id:e.pointerId, x:e.clientX, y:e.clientY, sc, mid:e.button===1, on:false, ax:scrMax(sc,'x')>1, ay:scrMax(sc,'y')>1, s:[[now(),e.clientX,e.clientY]] };
  },true);
  D.addEventListener('pointermove',e=>{
    const g=drg; if(!g || e.pointerId!==g.id) return;
    const dx=e.clientX-g.x, dy=e.clientY-g.y;
    if(!g.on){ if(Math.hypot(dx,dy)<DRAG_MOVE) return;
      if(!g.mid && DR.cancel && DR.cancel(g.sc,dx,dy)){ drg=null; return; }
      g.on=true; g.sc.classList.add('uk-drag'); D.documentElement.classList.add('uk-drag');
      try{ getSelection().removeAllRanges(); }catch(x){}
      if(DR.start) DR.start(g.sc); }
    if(g.ay) g.sc.scrollTop-=dy; if(g.ax) g.sc.scrollLeft-=dx; g.x=e.clientX; g.y=e.clientY;
    const t=now(); g.s.push([t,e.clientX,e.clientY]); while(g.s.length>2 && t-g.s[0][0]>90) g.s.shift();
    e.preventDefault();
  },true);
  function dragEnd(e){
    const g=drg; if(!g || e.pointerId!==g.id) return; drg=null;
    if(!g.on) return;
    g.sc.classList.remove('uk-drag'); D.documentElement.classList.remove('uk-drag');
    eatClick=now()+800;                                                  // the click (or auxclick) this release makes is not a click
    if(DR.end) DR.end(g.sc,true);
    const t=now(), a=g.s[0], b=g.s[g.s.length-1];
    if(e.type==='pointercancel' || !DR.coast || !a || t-b[0]>90) return;
    const dt=Math.max(16,b[0]-a[0]);
    coastGo(g.sc,g.ax ? (b[1]-a[1])/dt : 0,g.ay ? (b[2]-a[2])/dt : 0);
  }
  D.addEventListener('pointerup',dragEnd,true); D.addEventListener('pointercancel',dragEnd,true);
  const eatIt=e=>{ if(e.isTrusted && eatClick && now()<eatClick){ eatClick=0; e.stopImmediatePropagation(); e.preventDefault(); } };
  addEventListener('click',eatIt,true); addEventListener('auxclick',eatIt,true);
  D.addEventListener('pointerdown',()=>{ eatClick=0; },true);            // registered after the drag's own pointerdown: a fresh press forgets the old eat

  /* ==== SMOOTH WHEEL ==== UIK.wheel(root, {stop}): the wheel over a scroller inside root glides it to its target (one rAF for all), with
     Shift — sideways; Ctrl+wheel and <select> are left to the browser; stop — the wheel does not reach the page under it (the editor's 3D view) */
  function wheel(root,opt){
    opt=opt||{}; const WH=new Map(); let raf=0;                       // scroller → its wheel target {x, y}
    const step=()=>{ raf=0;
      for(const [el,g] of WH){ if(!el.isConnected){ WH.delete(el); continue; } let on=false;
        for(const ax of ['x','y']){ if(g[ax]==null) continue; const p=scrP(ax), d=g[ax]-el[p];
          if(Math.abs(d)<1){ el[p]=g[ax]; g[ax]=null; continue; } const was=el[p]; el[p]+=Math.sign(d)*Math.max(1,Math.abs(d)*.2); if(el[p]===was) g[ax]=null; else on=true; }
        if(!on) WH.delete(el); }
      if(WH.size) raf=requestAnimationFrame(step); };
    const kick=()=>{ if(!raf && WH.size) raf=requestAnimationFrame(step); };
    root.addEventListener('wheel',e=>{
      if(opt.stop) e.stopPropagation();                                // always, even with nothing to scroll: the page under the panel never gets it
      if(e.ctrlKey || e.target.closest && e.target.closest('select')) return;
      let dx=e.deltaX, dy=e.deltaY; if(e.shiftKey && !dx){ dx=dy; dy=0; }
      const ax=Math.abs(dy)>=Math.abs(dx) ? 'y' : 'x', d=ax==='y' ? dy : dx, el=scrOf(e.target,ax); if(!el || !d || el!==root && !root.contains(el)) return;
      e.preventDefault(); coastStop();
      const k=e.deltaMode===1 ? 36 : e.deltaMode===2 ? el[ax==='y' ? 'clientHeight' : 'clientWidth']*.9 : 1, g=WH.get(el)||{};
      g[ax]=Math.max(0,Math.min(scrMax(el,ax),(g[ax]??el[scrP(ax)])+d*k)); WH.set(el,g); kick();
    },{ passive:false });
    return { map:WH, kick };                                           // a page that re-renders its panels carries a glide over to the new element
  }

  /* ==== EDGE ARROWS ====
     UIK.edges(parent, {sel, z(el), hide()}) — an arrow layer over parent (rebuilt if parent's content is replaced): every scroller matching sel
     inside parent shows an arrow at each edge with more content past it; a tap scrolls most of a page that way. → {update, soon}.
     Updates itself on scroll, load, toggle, animation / transition end and resize inside parent; call soon() after a render.
     UIK.more(sc) — the same state on markers the page draws: .more.up / .more.dn children of the scroller's parent get .on */
  const MO_SVG='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 8l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function edges(parent,opt){
    opt=opt||{}; const sel=opt.sel||'.uk-scr', fixed=parent===D.body;
    let q=0, els=new WeakMap();
    const soon=()=>{ if(!q) q=requestAnimationFrame(()=>{ q=0; update(); }); };
    function update(){
      let lay=parent.querySelector(':scope>.uk-mol'); if(!lay){ lay=D.createElement('div'); lay.className='uk-mol'; if(fixed) lay.style.position='fixed'; parent.append(lay); els=new WeakMap(); }
      if(opt.hide && opt.hide()){ lay.style.opacity='0'; return; } lay.style.opacity='';
      const pr=fixed ? { left:0, top:0 } : parent.getBoundingClientRect();
      for(const el of parent.querySelectorAll(sel)){
        let a=els.get(el);
        const r=el.getBoundingClientRect(), vis=!!el.offsetParent && r.width>0 && r.height>0 && !el.closest('[hidden]'), v=el.scrollHeight-el.clientHeight, h=el.scrollWidth-el.clientWidth;
        if(!a){ if(!vis || v<3 && h<3) continue;
          a={}; for(const d of 'udlr'){ const b=D.createElement('button'); b.type='button'; b.className='uk-mo '+d; b.tabIndex=-1; b.setAttribute('aria-hidden','true'); b.innerHTML=MO_SVG;
            b.onclick=ev=>{ ev.stopPropagation(); const k=d==='u' || d==='l' ? -1 : 1; el.scrollBy(d==='u' || d==='d' ? { top:k*el.clientHeight*.8, behavior:'smooth' } : { left:k*el.clientWidth*.7, behavior:'smooth' }); };
            lay.append(b); a[d]=b; } els.set(el,a); }
        const z=opt.z ? opt.z(el) : 4, x=r.left-pr.left, y=r.top-pr.top;
        const on={ u:vis && v>2 && el.scrollTop>2, d:vis && v>2 && el.scrollTop<v-2, l:vis && h>2 && el.scrollLeft>2, r:vis && h>2 && el.scrollLeft<h-2 };
        const pos={ u:[x+r.width/2-15,y+4], d:[x+r.width/2-15,y+r.height-22], l:[x+2,y+r.height/2-13], r:[x+r.width-20,y+r.height/2-13] };
        for(const d of 'udlr'){ const b=a[d]; b.classList.toggle('on',on[d]); b.style.left=pos[d][0]+'px'; b.style.top=pos[d][1]+'px'; b.style.setProperty('--z',z); }
      }
    }
    parent.addEventListener('scroll',soon,true); parent.addEventListener('load',soon,true); parent.addEventListener('toggle',soon,true);
    parent.addEventListener('animationend',soon); parent.addEventListener('transitionend',soon); addEventListener('resize',soon);
    return { update, soon };
  }
  function more(sc){ const c=sc.parentNode, up=c && c.querySelector(':scope > .more.up'), dn=c && c.querySelector(':scope > .more.dn');
    if(!up || !dn) return;
    const t=sc.scrollTop, h=sc.scrollHeight-sc.clientHeight;
    up.classList.toggle('on',t>2); dn.classList.toggle('on',t<h-2); }

  /* ==== TAPS ON POINTERUP ====
     UIK.tap.set({on(t), ok(g, e), target(g, e)}): a finger (pen too — not the mouse) that goes down on a target on(t) and comes up on the same
     spot (< TAP_MOVE px) clicks it at once (a MouseEvent 'click', detail 1); the browser's own click that may follow is swallowed (until the
     next pointerdown, at most TAP_EAT ms). A swipe clicks nothing. ok(g, e) — false: no click (the target was hidden meanwhile);
     target(g, e) — the element to click instead of g.t. Default: buttons, not inside hidden / inert / disabled.
     UIK.tap.eat() — swallow the next native click (a page's own gesture ended on a control) */
  const TAP_MOVE=10, TAP_EAT=800;
  const TP={ on:t=>t.closest('button,[data-tap]') && !t.closest('input,label'), ok:g=>!g.t.closest('.hidden,[hidden],[inert],button:disabled'), target:null };
  let tapD=null, tapEat=0;
  const tapCan=t=>t && t.closest && TP.on && TP.on(t);
  D.addEventListener('pointerdown',e=>{ tapEat=0; const t=e.target;
    tapD=e.pointerType!=='mouse' && e.isPrimary && tapCan(t) ? { id:e.pointerId, x:e.clientX, y:e.clientY, t } : null;
    if(tapD && TP.down) TP.down(tapD,e); },true);
  D.addEventListener('pointercancel',()=>{ tapD=null; },true);
  D.addEventListener('pointerup',e=>{ const g=tapD; tapD=null;
    if(!g || g.id!==e.pointerId) return;
    if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>=TAP_MOVE){ tapEat=now()+TAP_EAT; return; }   // a swipe: do not click the control under the finger
    if(!g.t.isConnected || !g.t.contains(e.target)) return;
    if(TP.ok && !TP.ok(g,e)) return;
    tapEat=now()+TAP_EAT;
    ((TP.target && TP.target(g,e))||g.t).dispatchEvent(new MouseEvent('click',{ bubbles:true, cancelable:true, composed:true, detail:1, view:window, clientX:e.clientX, clientY:e.clientY, screenX:e.screenX, screenY:e.screenY })); },true);
  addEventListener('click',e=>{ if(e.isTrusted && tapEat && now()<tapEat){ tapEat=0; e.stopImmediatePropagation(); e.preventDefault(); } },true);
  const tap={ set:o=>Object.assign(TP,o), eat:()=>{ tapEat=now()+TAP_EAT; }, MOVE:TAP_MOVE, EAT:TAP_EAT };

  /* ==== POPUPS ====
     UIK.popup(el, close, {gap, anchor, esc, outside}) — while el (or el() — a page that re-renders it) is open: the mouse more than gap (25) px
     away from every edge of it closes it (close()); so do Esc and a press outside it (and outside anchor, the control that opened it). → off() */
  const POP_GAP=25;
  const pops=new Set();
  function popRect(p){ const el=typeof p.el==='function' ? p.el() : p.el; return el && el.isConnected && el.getClientRects().length ? el.getBoundingClientRect() : null; }
  const popIn=(el,t)=>{ const e=typeof el==='function' ? el() : el; return !!(e && t && e.contains(t)); };
  function popup(el,close,opt){
    opt=opt||{}; const p={ el, close, gap:opt.gap??POP_GAP, anchor:opt.anchor, esc:opt.esc!==false, outside:opt.outside!==false, armed:false };
    const off=()=>pops.delete(p); p.off=off; pops.add(p); return off;
  }
  function popShut(p){ pops.delete(p); try{ p.close(); }catch(e){ console.error(e); } }
  addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse' || !pops.size || e.buttons) return;
    for(const p of [...pops]){ const r=popRect(p); if(!r) continue;
      const dx=Math.max(r.left-e.clientX,0,e.clientX-r.right), dy=Math.max(r.top-e.clientY,0,e.clientY-r.bottom);
      if(Math.hypot(dx,dy)<=p.gap || popIn(p.anchor,e.target)) p.armed=true;
      else if(p.armed) popShut(p); } },true);   // opened from the keyboard, far from the mouse: waits until the mouse has been near it once
  addEventListener('pointerdown',e=>{ for(const p of [...pops]) if(p.outside && popRect(p) && !popIn(p.el,e.target) && !popIn(p.anchor,e.target)) popShut(p); },true);
  addEventListener('keydown',e=>{ if(e.key!=='Escape') return; const l=[...pops].filter(p=>p.esc && popRect(p)).pop(); if(l){ e.stopPropagation(); e.preventDefault(); popShut(l); } },true);

  /* ==== FOCUS ==== UIK.focus.keep(inside) remembers the focused control (not one inside `inside`), UIK.focus.back() returns focus there */
  let fRet=null;
  const focus={
    keep:(inside)=>{ const a=D.activeElement; fRet=a && a!==D.body && !(inside && (typeof inside==='string' ? a.closest(inside) : inside.contains(a))) ? a : null; },
    back:()=>{ const a=fRet; fRet=null; if(a && a.isConnected && !a.closest('[inert],[hidden],.hidden')) try{ a.focus({ preventScroll:true }); }catch(e){} },
    drop:()=>{ fRet=null; } };

  /* ==== MODAL WINDOWS ====
     UIK.modal(back, {card, esc(), outside(), enter(), keys}) — back is the full-screen backdrop (shown and hidden with its `hidden`), card the
     window in it. Keys pressed inside stay inside (keys:false — let them through); Esc → esc(), Enter → enter() (when given),
     a press and release on the backdrop itself (not the card) → outside(); clicks inside do not reach the page.
     → {show(focusEl), hide(), on()} — show remembers the focused control and focuses focusEl, hide returns focus */
  function modal(back,opt){
    opt=opt||{}; const card=opt.card||back.firstElementChild;
    if(card && !card.classList.contains('uk-scr') && opt.scroll!==false) card.classList.add('uk-scr');
    if(opt.keys!==false) ['keydown','keyup','keypress'].forEach(ev=>back.addEventListener(ev,e=>{ e.stopPropagation();
      if(ev!=='keydown') return;
      if(e.key==='Escape' && opt.esc){ e.preventDefault(); opt.esc(e); }
      else if(e.key==='Enter' && opt.enter && !(e.target.closest && e.target.closest('textarea,button'))){ e.preventDefault(); opt.enter(e); } }));
    let down=false;
    back.addEventListener('pointerdown',e=>{ down=e.target===back; });
    back.addEventListener('click',e=>{ const o=down && e.target===back; down=false; if(o && opt.outside) opt.outside(e); if(opt.stop!==false) e.stopPropagation(); });
    let ret=null;
    return {
      show(f){ const a=D.activeElement; ret=a && a!==D.body && !back.contains(a) ? a : null; back.hidden=false;
        if(f) setTimeout(()=>{ try{ f.focus({ preventScroll:true }); }catch(e){} },50); },
      hide(){ back.hidden=true; const a=ret; ret=null; if(a && a.isConnected && !a.closest('[inert],[hidden]')) try{ a.focus({ preventScroll:true }); }catch(e){} },
      on:()=>!back.hidden };
  }

  const K={ scrOf, scrollable, scrMax, drag:{ set:o=>Object.assign(DR,o), FIELDS, coastStop, busy:()=>!!(drg && drg.on) }, wheel, edges, more, tap, popup, focus, modal, POP_GAP };
  if(typeof window!=='undefined') window.UIK=K;
  return K;
})();

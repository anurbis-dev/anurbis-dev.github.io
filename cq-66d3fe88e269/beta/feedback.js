/* Data Cube — closed beta feedback button (loaded only by the beta page: src/js/fbsnap.js adds this script when BETA).
   Always on top of every screen. A tap takes a snapshot of the game (window.__cubeFb.snap) and a screenshot right away, pauses the
   game and opens a small form: bug / impression, text, optional voice note (MediaRecorder, up to VOICE_MAX s), the tester's name.
   Sent as JSON to the feedback worker (beta/worker), which files a GitHub issue with a link that replays this moment (beta/fb.html) */
(function(){
'use strict';
const FB=window.__cubeFb; if(!FB || document.getElementById('fbBtn')) return;
const API=(new URLSearchParams(location.search).get('fbapi')) || window.CUBE_FB_API;
const VOICE_MAX=60, LANGS=['ru','es','pt','de','fr','zh','ja','ko'];
const TR={
  'Feedback':['Отзыв','Comentarios','Feedback','Feedback','Avis','反馈','フィードバック','피드백'],
  'Bug':['Ошибка','Error','Bug','Fehler','Bug','错误','バグ','버그'],
  'Impression':['Впечатление','Impresión','Impressão','Eindruck','Impression','感受','感想','소감'],
  'What happened? Or what do you think of this moment?':['Что случилось? Или что вы думаете об этом моменте?','¿Qué pasó? ¿O qué te parece este momento?','O que aconteceu? Ou o que acha deste momento?','Was ist passiert? Oder wie findest du diesen Moment?','Que s\'est-il passé ? Ou que pensez-vous de ce moment ?','发生了什么？或者你觉得这一刻怎么样？','何が起きましたか？ この場面の感想は？','무슨 일이 있었나요? 아니면 이 순간이 어떤가요?'],
  'Your name (optional)':['Ваше имя (необязательно)','Tu nombre (opcional)','Seu nome (opcional)','Dein Name (optional)','Votre nom (facultatif)','你的名字（可选）','お名前（任意）','이름 (선택)'],
  'Attach screenshot':['Приложить снимок экрана','Adjuntar captura','Anexar captura de tela','Screenshot anhängen','Joindre une capture','附上截图','スクリーンショットを添付','스크린샷 첨부'],
  'Record voice':['Записать голос','Grabar voz','Gravar voz','Sprachnachricht','Enregistrer la voix','录音','音声を録音','음성 녹음'],
  'Stop':['Стоп','Detener','Parar','Stopp','Arrêter','停止','停止','정지'],
  'Delete':['Удалить','Borrar','Apagar','Löschen','Supprimer','删除','削除','삭제'],
  'Cancel':['Отмена','Cancelar','Cancelar','Abbrechen','Annuler','取消','キャンセル','취소'],
  'Send':['Отправить','Enviar','Enviar','Senden','Envoyer','发送','送信','보내기'],
  'Sending…':['Отправка…','Enviando…','Enviando…','Wird gesendet…','Envoi…','发送中…','送信中…','보내는 중…'],
  'Thank you! Sent.':['Спасибо! Отправлено.','¡Gracias! Enviado.','Obrigado! Enviado.','Danke! Gesendet.','Merci ! Envoyé.','谢谢！已发送。','ありがとう！ 送信しました。','감사합니다! 보냈습니다.'],
  'Couldn\'t send. Check the connection and try again.':['Не удалось отправить. Проверьте связь и попробуйте ещё раз.','No se pudo enviar. Revisa la conexión e inténtalo de nuevo.','Não foi possível enviar. Verifique a conexão e tente de novo.','Senden fehlgeschlagen. Prüfe die Verbindung und versuche es erneut.','Envoi impossible. Vérifiez la connexion et réessayez.','发送失败。请检查网络后重试。','送信できませんでした。 接続を確認してもう一度お試しください。','보내지 못했습니다. 연결을 확인하고 다시 시도하세요.'],
  'Microphone unavailable':['Микрофон недоступен','Micrófono no disponible','Microfone indisponível','Mikrofon nicht verfügbar','Micro indisponible','麦克风不可用','マイクが使えません','마이크를 사용할 수 없습니다'],
  'Write a few words or record your voice':['Напишите пару слов или запишите голос','Escribe unas palabras o graba tu voz','Escreva algumas palavras ou grave sua voz','Schreib ein paar Worte oder nimm eine Sprachnachricht auf','Écrivez quelques mots ou enregistrez votre voix','写几句话或录一段语音','ひとこと書くか、音声を録音してください','몇 마디 적거나 음성을 녹음하세요']
};
const t=s=>{ const i=LANGS.indexOf(FB.lang); return i>=0 && TR[s] ? TR[s][i] : s; };
const LSget=(k,d)=>{ try{ return localStorage.getItem(k) ?? d; }catch(e){ return d; } }, LSset=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };
let tester=LSget('cube-tester','');
if(!/^[0-9a-f]{12}$/.test(tester)){ tester=[...crypto.getRandomValues(new Uint8Array(6))].map(b=>b.toString(16).padStart(2,'0')).join(''); LSset('cube-tester',tester); }

const css=document.createElement('style');
css.textContent=`
#fbBtn{position:fixed;left:calc(6px + env(safe-area-inset-left));bottom:calc(6px + env(safe-area-inset-bottom));z-index:2147483000;width:34px;height:34px;border-radius:50%;
  border:1.5px solid rgba(255,255,255,.55);background:rgba(38,26,72,.55);color:#fff;padding:0;display:grid;place-items:center;cursor:pointer;opacity:.75;
  -webkit-tap-highlight-color:transparent;touch-action:manipulation}
#fbBtn:hover,#fbBtn:focus-visible{opacity:1}
#fbBtn svg{width:18px;height:18px}
#fbWrap{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;background:rgba(10,6,24,.55);padding:16px;font:15px/1.35 Quicksand,Nunito,system-ui,sans-serif;color:#f3eefc}
#fbWrap[hidden]{display:none}
#fbCard{width:min(420px,100%);max-height:100%;overflow:auto;box-sizing:border-box;background:linear-gradient(180deg,#2d1f55,#46307a);border:1px solid rgba(255,255,255,.18);
  border-radius:16px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.45);display:grid;gap:10px}
#fbCard h2{margin:0;font:600 19px Fredoka,Quicksand,system-ui,sans-serif;letter-spacing:.02em}
#fbCard .seg{display:flex;gap:6px}
#fbCard button{font:inherit;color:inherit;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);border-radius:10px;padding:8px 12px;cursor:pointer}
#fbCard .seg button{flex:1}
#fbCard .seg button[aria-pressed=true]{background:#ffd66b;color:#2d1f55;border-color:#ffd66b;font-weight:700}
#fbCard textarea,#fbCard input[type=text]{font:inherit;color:#fff;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:8px 10px;width:100%;box-sizing:border-box}
#fbCard textarea{min-height:84px;resize:vertical}
#fbCard label.shot{display:flex;align-items:center;gap:8px;font-size:14px}
#fbCard .pic{position:relative;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.3);min-height:60px;display:grid;place-items:center}
#fbCard .pic img{display:block;width:100%;max-height:min(42vh,320px);object-fit:contain}
#fbCard .pic.off img{opacity:.25;filter:grayscale(1)}
#fbCard .pic .wait{position:absolute;font-size:13px;opacity:.8}
#fbCard .voice{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
#fbCard #fbRec{grid-column:1/-1;width:100%;padding:12px;font-size:16px;font-weight:600}
#fbCard .voice audio{height:36px;width:100%;min-width:0}
#fbCard .voice .rec{background:#d64a5a;border-color:#d64a5a}
#fbCard .row{display:flex;gap:8px;justify-content:flex-end}
#fbCard .row .go{background:#ffd66b;color:#2d1f55;border-color:#ffd66b;font-weight:700}
#fbCard .msg{min-height:1.2em;font-size:13px;color:#ffd6de}
#fbCard .msg.ok{color:#c8f7c5}
#fbCard button:disabled{opacity:.5;cursor:default}
`;
document.head.append(css);

const btn=document.createElement('button');
btn.id='fbBtn'; btn.type='button'; btn.title=btn.ariaLabel='Feedback';
btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5" stroke-linecap="round"/></svg>';
const wrap=document.createElement('div'); wrap.id='fbWrap'; wrap.hidden=true;
wrap.innerHTML=`<div id="fbCard" role="dialog" aria-modal="true" aria-labelledby="fbH">
  <h2 id="fbH"></h2>
  <div class="seg"><button type="button" data-k="bug"></button><button type="button" data-k="opinion"></button></div>
  <textarea id="fbText" maxlength="4000"></textarea>
  <input id="fbNick" type="text" maxlength="40" autocomplete="nickname">
  <label class="shot"><input id="fbShotOn" type="checkbox" checked><span></span></label>
  <div class="pic" id="fbPic"><img id="fbShotImg" alt=""><span class="wait" id="fbShotWait">…</span></div>
  <div class="voice"><button type="button" id="fbRec"></button><audio id="fbAud" controls hidden></audio><button type="button" id="fbAudDel" hidden></button></div>
  <div class="msg" id="fbMsg"></div>
  <div class="row"><button type="button" id="fbCancel"></button><button type="button" class="go" id="fbSend"></button></div>
</div>`;
document.body.append(btn,wrap);
const $=id=>document.getElementById(id), seg=[...wrap.querySelectorAll('.seg button')];
['keydown','keyup','keypress'].forEach(ev=>wrap.addEventListener(ev,e=>{ e.stopPropagation(); if(ev==='keydown' && e.key==='Escape') close(); }));
btn.addEventListener('keydown',e=>e.stopPropagation());

let snap=null, shot=null, shotP=null, kind='bug', rec=null, voice=null, sending=false;
/* The screenshot: the level's backdrop and the WebGL frame (the game draws them, FB.shot), the page over it — HUD, menus, overlays —
   drawn by html-to-image (beta/vendor, MIT) from a clone of the DOM; the feedback UI itself is left out */
const BASE=(document.currentScript && document.currentScript.src || location.href).replace(/[^/]*(\?.*)?$/,'');
let h2i=null;
const h2iLoad=()=>h2i || (h2i=new Promise(ok=>{ if(window.htmlToImage) return ok(window.htmlToImage);
  const s=document.createElement('script'); s.src=BASE+'vendor/html-to-image.js'; s.onload=()=>ok(window.htmlToImage||null); s.onerror=()=>ok(null); document.head.append(s); }));
h2iLoad();
const SKIP=new Set(['fbBtn','fbWrap','stage','sky']);
/* Hidden overlays and menu sections are not drawn — they are most of the DOM (the level grids) and cost seconds to clone */
const keep=n=>!(n.id && SKIP.has(n.id)) && !n.hidden && !(n.classList && (n.classList.contains('hidden') || n.classList.contains('msec') && !n.classList.contains('on')));
/* The page's web fonts for the picture (an SVG image cannot use the document's): the Google Fonts CSS with its latin and cyrillic
   files inlined, built once; the library itself would try to read the cross-origin sheet and log errors */
let fontCss=null;
const toData=u=>fetch(u).then(r=>r.blob()).then(b=>new Promise(ok=>{ const f=new FileReader(); f.onload=()=>ok(f.result); f.onerror=()=>ok(u); f.readAsDataURL(b); }));
const fontsLoad=()=>fontCss || (fontCss=(async()=>{
  const l=document.querySelector('link[rel=stylesheet][href*="fonts.googleapis.com"]'); if(!l) return '';
  try{ const css=await (await fetch(l.href)).text(), out=[];
    for(const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g)){ if(!/^(latin|cyrillic)$/.test(m[1])) continue;
      const u=(m[2].match(/url\(([^)]+)\)/)||[])[1]; out.push(u ? m[2].replace(u,await toData(u.replace(/['"]/g,''))) : m[2]); }
    return out.join('\n'); }catch(e){ return ''; } })());
setTimeout(fontsLoad,4000);   // ready before the first tap
async function capture(){
  const base=FB.shot(1280); if(!base) return null;
  try{ const [lib,fc]=await Promise.all([h2iLoad(),fontsLoad()]);
    if(lib){ const page=await lib.toCanvas(document.body,{ width:innerWidth, height:innerHeight, pixelRatio:base.width/innerWidth, backgroundColor:null,
        style:{ background:'transparent', margin:'0' }, filter:keep, fontEmbedCSS:fc, cacheBust:false, imagePlaceholder:'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
      base.getContext('2d').drawImage(page,0,0,base.width,base.height); } }
  catch(e){ console.warn('feedback: page capture',e); }
  return base.toDataURL('image/jpeg',.78);
}
function texts(){
  $('fbH').textContent=t('Feedback'); seg[0].textContent=t('Bug'); seg[1].textContent=t('Impression');
  $('fbText').placeholder=t('What happened? Or what do you think of this moment?'); $('fbNick').placeholder=t('Your name (optional)');
  wrap.querySelector('label.shot span').textContent=t('Attach screenshot'); $('fbAudDel').textContent=t('Delete');
  $('fbCancel').textContent=t('Cancel'); $('fbSend').textContent=t('Send'); recTxt();
}
function setKind(k){ kind=k; seg.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===k))); }
seg.forEach(b=>b.onclick=()=>setKind(b.dataset.k));
function msg(s,ok){ const m=$('fbMsg'); m.textContent=s||''; m.classList.toggle('ok',!!ok); }

function open(){
  if(!wrap.hidden) return;
  try{ snap=FB.snap(); }catch(e){ console.error(e); snap=null; }
  FB.pause(true);
  shot=null; shotP=capture().then(d=>{ shot=d; showShot(); return d; });
  texts(); setKind(kind); msg(''); sending=false; $('fbSend').disabled=false;
  $('fbNick').value=LSget('cube-tester-nm','');
  $('fbShotImg').removeAttribute('src'); $('fbShotWait').hidden=false; $('fbShotOn').checked=true; $('fbShotOn').disabled=false; showShot();
  wrap.hidden=false; setTimeout(()=>$('fbText').focus({ preventScroll:true }),50);
}
function showShot(){ const on=$('fbShotOn').checked; $('fbPic').classList.toggle('off',!on);
  if(shot){ $('fbShotImg').src=shot; $('fbShotWait').hidden=true; } else if(shotP===null){ $('fbShotWait').hidden=true; } }
function close(){
  if(wrap.hidden) return; recStop(true); wrap.hidden=true; FB.pause(false);
  $('fbText').value=''; voiceDel(); snap=shot=shotP=null; btn.blur();
}
btn.onclick=open;
$('fbCancel').onclick=close;
$('fbShotOn').onchange=showShot;
wrap.addEventListener('pointerdown',e=>{ if(e.target===wrap) wrap.dataset.out='1'; });
wrap.addEventListener('click',e=>{ if(e.target===wrap && wrap.dataset.out && !sending) close(); delete wrap.dataset.out; });

/* Voice note */
function recTxt(s){ const b=$('fbRec'); b.textContent=rec ? '■ '+t('Stop')+' '+(s||'0:00') : '🎤 '+t('Record voice'); b.classList.toggle('rec',!!rec); }
const mm=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function voiceDel(){ if(voice) URL.revokeObjectURL(voice.url); voice=null; $('fbAud').hidden=$('fbAudDel').hidden=true; $('fbAud').removeAttribute('src'); }
$('fbAudDel').onclick=()=>{ voiceDel(); recTxt(); };
async function recStart(){
  if(!navigator.mediaDevices || !window.MediaRecorder) return msg(t('Microphone unavailable'));
  let st; try{ st=await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true } }); }catch(e){ return msg(t('Microphone unavailable')); }
  if(wrap.hidden){ st.getTracks().forEach(x=>x.stop()); return; }
  const type=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4','audio/webm'].find(x=>MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x))||'';
  const mr=new MediaRecorder(st,type ? { mimeType:type, audioBitsPerSecond:32000 } : { audioBitsPerSecond:32000 }), parts=[], t0=performance.now();
  rec={ mr, st, t0, iv:setInterval(()=>{ const s=(performance.now()-t0)/1000; recTxt(mm(s)); if(s>=VOICE_MAX) recStop(); },250), drop:false };
  mr.ondataavailable=e=>{ if(e.data && e.data.size) parts.push(e.data); };
  mr.onstop=()=>{ const r=rec; st.getTracks().forEach(x=>x.stop()); if(!r || r.drop){ rec=null; recTxt(); return; }
    rec=null; voiceDel(); const blob=new Blob(parts,{ type:mr.mimeType||type||'audio/webm' });
    voice={ blob, dur:Math.round((performance.now()-t0)/1000), url:URL.createObjectURL(blob) };
    $('fbAud').src=voice.url; $('fbAud').hidden=$('fbAudDel').hidden=false; recTxt(); };
  voiceDel(); mr.start(); recTxt(); msg('');
}
function recStop(drop){ if(!rec) return; clearInterval(rec.iv); rec.drop=!!drop; try{ rec.mr.stop(); }catch(e){ rec=null; recTxt(); } }
$('fbRec').onclick=()=>rec ? recStop() : recStart();

/* Send */
const b64=blob=>new Promise((ok,no)=>{ const r=new FileReader(); r.onload=()=>ok(r.result); r.onerror=no; r.readAsDataURL(blob); });
$('fbSend').onclick=async()=>{
  if(sending) return; if(rec) recStop();
  await new Promise(r=>setTimeout(r,rec ? 300 : 0));
  const text=$('fbText').value.trim();
  if(!text && !voice) return msg(t('Write a few words or record your voice'));
  const nick=$('fbNick').value.trim(); LSset('cube-tester-nm',nick);
  sending=true; $('fbSend').disabled=true; msg(t('Sending…'),true);
  try{
    const pic=$('fbShotOn').checked ? await shotP : null;
    const body={ tester, nick, kind, text, snap, shot:pic,
      audio:voice ? { data:await b64(voice.blob), dur:voice.dur } : null };
    const r=await fetch(API.replace(/\/$/,'')+'/fb',{ method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(body) });
    if(!r.ok) throw new Error('HTTP '+r.status+' '+(await r.text()).slice(0,200));
    msg(t('Thank you! Sent.'),true); setTimeout(close,1100);
  }catch(e){ console.warn('feedback:',e); msg(t('Couldn\'t send. Check the connection and try again.')); sending=false; $('fbSend').disabled=false; }
};
})();

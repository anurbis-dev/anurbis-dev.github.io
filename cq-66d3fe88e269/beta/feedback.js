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
  'Introduce yourself to start testing':['Представьтесь, чтобы начать тестирование','Preséntate para empezar a probar','Apresente-se para começar a testar','Stell dich vor, um mit dem Testen zu beginnen','Présentez-vous pour commencer le test','请先介绍自己再开始测试','テストを始める前に名乗ってください','테스트를 시작하려면 자신을 소개하세요'],
  'I\'m new':['Я новенький','Soy nuevo','Sou novo','Ich bin neu','Je suis nouveau','我是新人','はじめて','처음이에요'],
  'I have a nickname':['У меня есть ник','Ya tengo apodo','Já tenho apelido','Ich habe einen Namen','J\'ai déjà un pseudo','我已有昵称','ニックネームがある','닉네임이 있어요'],
  'Nickname':['Ник','Apodo','Apelido','Spitzname','Pseudo','昵称','ニックネーム','닉네임'],
  'PIN (4–6 digits)':['PIN (4–6 цифр)','PIN (4–6 dígitos)','PIN (4–6 dígitos)','PIN (4–6 Ziffern)','PIN (4–6 chiffres)','PIN（4–6 位数字）','PIN（4〜6桁）','PIN (4–6자리 숫자)'],
  'Remember the PIN: with it you sign in on another device.':['Запомните PIN: с ним вы войдёте на другом устройстве.','Recuerda el PIN: con él entrarás desde otro dispositivo.','Lembre o PIN: com ele você entra em outro dispositivo.','Merk dir die PIN: damit meldest du dich auf einem anderen Gerät an.','Retenez le PIN : il vous connecte sur un autre appareil.','记住 PIN：在其他设备上用它登录。','PIN を覚えておいてください。別の端末でのログインに使います。','PIN을 기억하세요. 다른 기기에서 로그인할 때 필요해요.'],
  'Continue':['Продолжить','Continuar','Continuar','Weiter','Continuer','继续','続ける','계속'],
  'Change':['Сменить','Cambiar','Trocar','Wechseln','Changer','更换','変更','변경'],
  'This nickname is taken':['Этот ник уже занят','Ese apodo ya está ocupado','Esse apelido já está em uso','Dieser Name ist vergeben','Ce pseudo est déjà pris','该昵称已被占用','このニックネームは使われています','이미 사용 중인 닉네임이에요'],
  'Wrong nickname or PIN':['Неверный ник или PIN','Apodo o PIN incorrecto','Apelido ou PIN incorreto','Falscher Name oder falsche PIN','Pseudo ou PIN incorrect','昵称或 PIN 错误','ニックネームまたは PIN が違います','닉네임 또는 PIN이 틀렸어요'],
  'Too many attempts. Try again in 15 minutes.':['Слишком много попыток. Попробуйте через 15 минут.','Demasiados intentos. Inténtalo en 15 minutos.','Tentativas demais. Tente em 15 minutos.','Zu viele Versuche. Versuch es in 15 Minuten erneut.','Trop de tentatives. Réessayez dans 15 minutes.','尝试次数过多，请 15 分钟后再试。','試行回数が多すぎます。15分後にお試しください。','시도 횟수가 너무 많아요. 15분 후에 다시 시도하세요.'],
  'Nickname: 2–20 letters or digits':['Ник: 2–20 букв или цифр','Apodo: 2–20 letras o números','Apelido: 2–20 letras ou números','Name: 2–20 Buchstaben oder Ziffern','Pseudo : 2 à 20 lettres ou chiffres','昵称：2–20 个字母或数字','ニックネーム：2〜20文字の文字または数字','닉네임: 글자나 숫자 2–20자'],
  'PIN: 4–6 digits':['PIN: 4–6 цифр','PIN: 4–6 dígitos','PIN: 4–6 dígitos','PIN: 4–6 Ziffern','PIN : 4 à 6 chiffres','PIN：4–6 位数字','PIN：4〜6桁の数字','PIN: 숫자 4–6자리'],
  'No connection. Try again.':['Нет связи. Попробуйте ещё раз.','Sin conexión. Inténtalo de nuevo.','Sem conexão. Tente de novo.','Keine Verbindung. Versuch es erneut.','Pas de connexion. Réessayez.','无法连接，请重试。','接続できません。もう一度お試しください。','연결되지 않아요. 다시 시도하세요.'],
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
const tester=LSget('cube-tester','');   // a device id from before the sign-in: a new nickname takes it (its earlier reports join the name)
let acct=null; try{ acct=JSON.parse(LSget('cube-tester-acct','null')); if(!acct || !acct.tok || !acct.nick) acct=null; }catch(e){}
FB.up=true;   // fbsnap.js: the beta notice stays locked until the sign-in lets it go
const post=async(path,body)=>{ const r=await fetch(API.replace(/\/$/,'')+path,{ method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(body) });
  let d={}; try{ d=await r.json(); }catch(e){} if(!r.ok) throw Object.assign(new Error(d.error||'HTTP '+r.status),{ status:r.status }); return d; };

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
body:not(.fbin) #fbBtn{display:none}
#fbGate{display:grid;gap:8px;margin:14px 0 12px;text-align:left;font-weight:700}
#fbGate[hidden]{display:none}
#fbGate .lead{text-align:center;font-size:14px;opacity:.9}
#fbGate .seg{display:flex;border:1.5px solid rgba(255,255,255,.35);border-radius:12px;overflow:hidden}
#fbGate .seg button{flex:1;border:0;background:transparent;color:inherit;font:inherit;font-size:14px;padding:8px 6px;cursor:pointer}
#fbGate .seg button[aria-pressed=true]{background:#ffd66b;color:#2d1f55}
#fbGate input{font:inherit;font-size:16px;color:#fff;background:rgba(0,0,0,.28);border:1.5px solid rgba(255,255,255,.3);border-radius:12px;padding:10px 12px;width:100%;box-sizing:border-box}
#fbGate input:focus{outline:none;border-color:#ffd66b}
#fbGate small{font-size:13px;opacity:.75;text-align:center}
#fbGate .go{font:inherit;font-size:16px;border:0;border-radius:12px;padding:11px;background:#ffd66b;color:#2d1f55;cursor:pointer}
#fbGate .go:disabled{opacity:.6;cursor:default}
#fbGate .msg{min-height:1.2em;font-size:13px;color:#ffb3c0;text-align:center}
#fbGate .me{display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px}
#fbGate .me button{font:inherit;font-size:13px;color:inherit;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:3px 12px;cursor:pointer}
#tBetaOk:disabled{opacity:.4;filter:grayscale(.6);cursor:default}
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
  $('fbText').placeholder=t('What happened? Or what do you think of this moment?');
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
  sending=true; $('fbSend').disabled=true; msg(t('Sending…'),true);
  try{
    const pic=$('fbShotOn').checked ? await shotP : null;
    await post('/fb',{ tok:acct && acct.tok, kind, text, snap, shot:pic, audio:voice ? { data:await b64(voice.blob), dur:voice.dur } : null });
    msg(t('Thank you! Sent.'),true); setTimeout(close,1100);
  }catch(e){ console.warn('feedback:',e); msg(t('Couldn\'t send. Check the connection and try again.')); sending=false; $('fbSend').disabled=false; }
};

/* Sign-in on the beta notice: a nickname and a PIN — new (register) or one already made on another device (login).
   Until then "I agree" is disabled; signed in — the name is shown with "Change", the feedback button appears */
const tb=document.getElementById('tBetaOk'), gate=document.createElement('div'); gate.id='fbGate';
gate.innerHTML=`<div class="me" id="fgMe" hidden><span>👤 <b id="fgNm"></b></span><button type="button" id="fgChg"></button></div>
  <div id="fgForm" hidden><div style="display:grid;gap:8px">
    <span class="lead" id="fgLead"></span>
    <div class="seg"><button type="button" data-m="new"></button><button type="button" data-m="old"></button></div>
    <input id="fgNick" type="text" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false">
    <input id="fgPin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password">
    <small id="fgHint"></small>
    <button type="button" class="go" id="fgGo"></button>
    <div class="msg" id="fgMsg"></div></div></div>`;
if(tb) tb.before(gate);
const gm=[...gate.querySelectorAll('.seg button')]; let gMode='new', gBusy=false;
['keydown','keyup','keypress'].forEach(ev=>gate.addEventListener(ev,e=>{ e.stopPropagation(); if(ev==='keydown' && e.key==='Enter' && e.target.tagName==='INPUT'){ e.preventDefault(); $('fgGo').click(); } }));
gate.addEventListener('click',e=>e.stopPropagation());   // the title's own tap handler stays out of it
function gTexts(){
  $('fgLead').textContent=t('Introduce yourself to start testing'); gm[0].textContent=t('I\'m new'); gm[1].textContent=t('I have a nickname');
  $('fgNick').placeholder=t('Nickname'); $('fgPin').placeholder=t('PIN (4–6 digits)'); $('fgHint').textContent=gMode==='new' ? t('Remember the PIN: with it you sign in on another device.') : '';
  $('fgGo').textContent=t('Continue'); $('fgChg').textContent=t('Change');
}
function gMode_(m){ gMode=m; gm.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m))); $('fgPin').autocomplete=m==='new' ? 'new-password' : 'current-password'; $('fgMsg').textContent=''; gTexts(); }
gm.forEach(b=>b.onclick=()=>gMode_(b.dataset.m));
function gSync(){
  const on=!!acct; $('fgMe').hidden=!on; $('fgForm').hidden=on; if(on) $('fgNm').textContent=acct.nick;
  document.body.classList.toggle('fbin',on); if(tb) tb.disabled=!on;
}
$('fgChg').onclick=()=>{ acct=null; try{ localStorage.removeItem('cube-tester-acct'); }catch(e){} gMode_('old'); gSync(); $('fgNick').focus(); };
$('fgGo').onclick=async()=>{
  if(gBusy) return; const nick=$('fgNick').value.trim().replace(/\s+/g,' '), pin=$('fgPin').value.trim(), M=s=>{ $('fgMsg').textContent=s; };
  if(!/^[\p{L}\p{N}][\p{L}\p{N} _.\-]{0,18}[\p{L}\p{N}]$/u.test(nick)) return M(t('Nickname: 2–20 letters or digits'));
  if(!/^\d{4,6}$/.test(pin)) return M(t('PIN: 4–6 digits'));
  gBusy=true; $('fgGo').disabled=true; M('…');
  try{ const d=await post(gMode==='new' ? '/tester/register' : '/tester/login',{ nick, pin, id:tester });
    acct={ id:d.id, nick:d.nick, tok:d.tok }; LSset('cube-tester-acct',JSON.stringify(acct)); LSset('cube-tester',d.id); M(''); $('fgPin').value=''; gSync(); }
  catch(e){ M(t(e.message==='taken' ? 'This nickname is taken' : e.message==='wrong' ? 'Wrong nickname or PIN' : e.message==='locked' ? 'Too many attempts. Try again in 15 minutes.'
      : e.message==='nick' ? 'Nickname: 2–20 letters or digits' : e.message==='pin' ? 'PIN: 4–6 digits' : 'No connection. Try again.')); }
  finally{ gBusy=false; $('fgGo').disabled=false; }
};
document.addEventListener('cube-lang',()=>{ gTexts(); if(!wrap.hidden) texts(); });
gMode_('new'); gSync();
})();

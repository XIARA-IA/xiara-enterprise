/* XIARA V8 — Chat Enterprise */
(function(){
'use strict';

const FB='10.12.5';
const C=window.XIARA_CHAT_CONFIG||{};
const state={
  app:null,auth:null,fs:null,storage:null,fns:null,messaging:null,
  user:null,profile:null,companyId:null,
  conversations:[],activeConversation:null,messages:[],peers:[],presence:new Map(),
  convUnsub:null,msgUnsub:null,presenceUnsub:null,typingUnsub:null,
  heartbeat:null,typingTimer:null,replyTo:null,search:'',settings:null
};

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nowMs=()=>Date.now();
function fmt(ts){
  try{
    const d=ts?.toDate?ts.toDate():new Date(ts||Date.now());
    return d.toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  }catch(_e){return '';}
}
function uid(){return state.user?.uid||'';}
function canChat(action='ver'){
  const p=window.XIARA_PERMISSIONS;
  if(!p?.loaded)return false;
  return p.can?.('chat',action)===true;
}
function currentCompany(){
  return $('companySel')?.value || window.XIARA_CONTEXT_API?.getCompanyId?.() || state.profile?.empresas?.[0] || null;
}
async function imports(){
  const [appM,authM,fsM,stM,fnM]=await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`),
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-storage.js`),
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-functions.js`)
  ]);
  return {appM,authM,fsM,stM,fnM};
}
async function call(name,data={}){
  const fnM=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-functions.js`);
  return (await fnM.httpsCallable(state.fns,name)(data)).data;
}
function playSound(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    const ac=new AC(),o=ac.createOscillator(),g=ac.createGain();
    o.frequency.value=880;g.gain.value=.045;o.connect(g);g.connect(ac.destination);
    o.start();setTimeout(()=>{g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.12);o.stop(ac.currentTime+.13);},70);
  }catch(_e){}
}

function chatModal(html){
  const box=document.getElementById('modalBox');
  const ov=document.getElementById('modal');
  if(box && ov){
    box.innerHTML=html;
    ov.classList.add('open');
    return true;
  }

  // Fallback modal propio de Chat si el modal histórico no está disponible.
  let shell=document.getElementById('xiaraChatModalFallback');
  if(!shell){
    shell=document.createElement('div');
    shell.id='xiaraChatModalFallback';
    shell.style.cssText='position:fixed;inset:0;z-index:999999;background:#0008;display:flex;align-items:center;justify-content:center;padding:20px';
    shell.innerHTML='<div id="xiaraChatModalFallbackBox" style="background:#fff;width:min(760px,96vw);max-height:90vh;overflow:auto;border-radius:16px;padding:18px;box-shadow:0 20px 60px #0006"></div>';
    shell.addEventListener('click',e=>{if(e.target===shell)shell.remove();});
    document.body.appendChild(shell);
  }
  const b=document.getElementById('xiaraChatModalFallbackBox');
  if(b)b.innerHTML=html;
  return true;
}
function chatCloseModal(){
  try{window.closeModal?.();}catch(_e){}
  document.getElementById('xiaraChatModalFallback')?.remove();
}

function toast(text){
  let d=$('xiaraChatToast');
  if(!d){
    d=document.createElement('div');d.id='xiaraChatToast';
    d.style.cssText='position:fixed;right:18px;bottom:18px;z-index:999999;background:#111827;color:white;padding:12px 16px;border-radius:12px;box-shadow:0 12px 30px #0004;max-width:360px;font-weight:700';
    document.body.appendChild(d);
  }
  d.textContent=text;d.style.display='block';clearTimeout(d._t);d._t=setTimeout(()=>d.style.display='none',3500);
}
function linkify(text){
  const safe=esc(text||'');
  return safe.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}
function isOnline(p){
  const ms=p?.lastSeenMs || (p?.lastSeenAt?.toMillis?.()||0);
  return !!p?.online && nowMs()-ms < (C.presenceOnlineThresholdMs||90000);
}
function ensureStyles(){
  if($('xiaraChatStyles'))return;
  const s=document.createElement('style');s.id='xiaraChatStyles';
  s.textContent=`
  #chat{padding-bottom:30px}
  .xchat-shell{display:grid;grid-template-columns:330px 1fr;gap:12px;min-height:68vh}
  .xchat-panel{background:#fff;border:1px solid #dbe3ef;border-radius:16px;overflow:hidden}
  .xchat-left{display:flex;flex-direction:column}
  .xchat-toolbar{padding:12px;border-bottom:1px solid #e5e7eb;display:flex;gap:7px;flex-wrap:wrap}
  .xchat-convs{overflow:auto;max-height:62vh}
  .xchat-conv{padding:11px 12px;border-bottom:1px solid #eef2f7;cursor:pointer;display:flex;gap:9px;align-items:center}
  .xchat-conv:hover,.xchat-conv.active{background:#f3f0ff}
  .xchat-dot{width:10px;height:10px;border-radius:50%;background:#94a3b8;flex:0 0 auto}.xchat-dot.online{background:#22c55e}
  .xchat-unread{margin-left:auto;background:#ef4444;color:#fff;border-radius:999px;min-width:22px;padding:2px 6px;text-align:center;font-size:12px;font-weight:900}
  .xchat-main{display:flex;flex-direction:column;min-width:0}
  .xchat-head{padding:12px 14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:10px;align-items:center}
  .xchat-msgs{flex:1;overflow:auto;max-height:52vh;padding:15px;background:#f7f8fb}
  .xchat-msg{max-width:78%;margin:7px 0;padding:9px 11px;border-radius:13px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 1px 2px #0000000d}
  .xchat-msg.mine{margin-left:auto;background:#ede9fe;border-color:#ddd6fe}
  .xchat-meta{font-size:11px;color:#64748b;margin-top:4px}
  .xchat-reply{border-left:3px solid #7c3aed;padding-left:7px;color:#475569;font-size:12px;margin-bottom:5px}
  .xchat-compose{padding:10px;border-top:1px solid #e5e7eb;display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:end}
  .xchat-compose textarea{min-height:44px;max-height:120px;resize:vertical}
  .xchat-typing{font-size:12px;color:#64748b;padding:0 14px 5px}
  .xchat-attach{display:block;margin-top:7px;max-width:260px;border-radius:10px}
  .xchat-file{display:inline-block;margin-top:7px;padding:7px 9px;border-radius:9px;background:#eef2ff}
  .xchat-topbadge{background:#111827;color:#fff;border-radius:999px;padding:4px 9px;font-size:12px}
  @media(max-width:850px){.xchat-shell{grid-template-columns:1fr}.xchat-left{max-height:38vh}.xchat-msgs{max-height:46vh}}
  `;
  document.head.appendChild(s);
}
function renderShell(){
  ensureStyles();
  const sec=$('chat');if(!sec)return;
  sec.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div><h2 style="margin:0">💬 XIARA Chat</h2><div class="muted">Mensajería interna segura por empresa, usuario y área.</div></div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        <button class="secondary" onclick="xiaraChatEnablePush()">🔔 Activar notificaciones</button>
        <button class="secondary" onclick="xiaraChatValidate()">VALIDAR CHAT V8</button>
        ${window.XIARA_PERMISSIONS?.isAdmin?.()?'<button class="secondary" onclick="xiaraChatAdminSettings()">⚙️ Chat Admin</button>':''}
      </div>
    </div>
    <div class="xchat-shell">
      <div class="xchat-panel xchat-left">
        <div class="xchat-toolbar">
          <button onclick="xiaraChatNewDirect()">+ Directo</button>
          <button class="secondary" onclick="xiaraChatNewArea()">+ Área</button>
          <input id="xchatConvSearch" placeholder="Buscar chats..." oninput="xiaraChatRenderConversations()" style="flex:1;min-width:120px">
        </div>
        <div id="xchatConvs" class="xchat-convs"></div>
      </div>
      <div class="xchat-panel xchat-main">
        <div id="xchatHead" class="xchat-head"><b>Selecciona una conversación</b></div>
        <div style="padding:8px 12px;border-bottom:1px solid #eef2f7"><input id="xchatMsgSearch" placeholder="Buscar en mensajes cargados..." oninput="xiaraChatSearchMessages()" style="width:100%"></div>
        <div id="xchatMsgs" class="xchat-msgs"></div>
        <div id="xchatTyping" class="xchat-typing"></div>
        <div id="xchatReplyBar" style="display:none;padding:7px 12px;background:#f3f0ff;border-top:1px solid #ddd6fe"></div>
        <div class="xchat-compose">
          <label class="secondary" style="padding:9px 11px;border-radius:10px;cursor:pointer">📎<input id="xchatFile" type="file" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none"></label>
          <textarea id="xchatText" placeholder="Escribe un mensaje..." oninput="xiaraChatTyping()"></textarea>
          <button onclick="xiaraChatSend()">Enviar</button>
        </div>
      </div>
    </div>`;
  renderConversations();
}
function conversationName(c){
  if(c.name)return c.name;
  if(c.type==='direct'){
    const profiles=Array.isArray(c.memberProfiles)
      ? c.memberProfiles
      : Object.values(c.memberProfiles||{});
    const other=profiles.find(x=>x?.uid!==uid());
    return other?.name||other?.email||'Chat directo';
  }
  return c.area?`Área ${c.area}`:'Grupo';
}
function memberProfilesArray(c){
  return Array.isArray(c?.memberProfiles)
    ? c.memberProfiles
    : Object.values(c?.memberProfiles||{});
}
function convOtherPresence(c){
  if(c.type!=='direct')return null;
  const other=(c.memberUids||[]).find(x=>x!==uid());
  return state.presence.get(other)||null;
}
function renderConversations(){
  const w=$('xchatConvs');if(!w)return;
  const q=($('xchatConvSearch')?.value||'').toLowerCase();
  const arr=[...state.conversations].sort((a,b)=>{
    const ap=(a.pinnedBy||[]).includes(uid())?1:0,bp=(b.pinnedBy||[]).includes(uid())?1:0;
    if(ap!==bp)return bp-ap;
    return (b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0);
  }).filter(c=>conversationName(c).toLowerCase().includes(q));
  w.innerHTML=arr.map(c=>{
    const p=convOtherPresence(c),unread=c.unreadBy?.[uid()]||0,pin=(c.pinnedBy||[]).includes(uid()),mute=(c.mutedBy||[]).includes(uid());
    return `<div class="xchat-conv ${state.activeConversation?.id===c.id?'active':''}" onclick="xiaraChatOpen('${c.id}')">
      <span class="xchat-dot ${p&&isOnline(p)?'online':''}"></span>
      <div style="min-width:0;flex:1"><div style="font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${pin?'📌 ':''}${esc(conversationName(c))}${mute?' 🔕':''}</div>
      <div class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.lastMessageText||'Sin mensajes')}</div></div>
      ${unread?`<span class="xchat-unread">${unread}</span>`:''}
    </div>`;
  }).join('')||'<div class="muted" style="padding:15px">No hay conversaciones.</div>';
  updateGlobalBadge();
}
function updateGlobalBadge(){
  const n=state.conversations.reduce((s,c)=>s+(c.unreadBy?.[uid()]||0),0);
  const b=$('xiaraChatUnreadBadge');if(!b)return;
  b.textContent=n;b.style.display=n?'inline-block':'none';
}
function renderHeader(){
  const c=state.activeConversation,w=$('xchatHead');if(!w)return;
  if(!c){w.innerHTML='<b>Selecciona una conversación</b>';return;}
  const p=convOtherPresence(c);
  w.innerHTML=`<div><b>${esc(conversationName(c))}</b><div class="muted" style="font-size:12px">${p?(isOnline(p)?'🟢 Disponible':'⚪ Últ. vez '+fmt(p.lastSeenAt||p.lastSeenMs)):c.type==='area'?'Chat de área':'Conversación'}</div></div>
    <div style="display:flex;gap:5px"><button class="secondary" onclick="xiaraChatTogglePin()">${(c.pinnedBy||[]).includes(uid())?'Desfijar':'📌 Fijar'}</button>
    <button class="secondary" onclick="xiaraChatToggleMute()">${(c.mutedBy||[]).includes(uid())?'🔔 Activar':'🔕 Silenciar'}</button></div>`;
}
function receiptText(m){
  const c=state.activeConversation;if(!c||m.senderUid!==uid())return '';
  const others=(c.memberUids||[]).filter(x=>x!==uid());
  if(!others.length)return '';
  const t=m.createdAt?.toMillis?.()||0;
  const read=others.filter(x=>(c.lastReadAtBy?.[x]?.toMillis?.()||0)>=t).length;
  const delivered=others.filter(x=>(c.lastDeliveredAtBy?.[x]?.toMillis?.()||0)>=t).length;
  if(read===others.length)return '✓✓ leído';
  if(delivered)return '✓✓ entregado';
  return '✓ enviado';
}
function renderMessages(){
  const w=$('xchatMsgs');if(!w)return;
  const q=(state.search||'').toLowerCase();
  const arr=state.messages.filter(m=>!q||String(m.text||'').toLowerCase().includes(q));
  w.innerHTML=arr.map(m=>{
    const mine=m.senderUid===uid(),deleted=!!m.deletedAt;
    const att=m.attachment;
    let attachment='';
    if(att&&!deleted){
      if(String(att.mime||'').startsWith('image/')) attachment=`<a href="${esc(att.url)}" target="_blank" rel="noopener"><img class="xchat-attach" src="${esc(att.url)}" alt="imagen"></a>`;
      else attachment=`<a class="xchat-file" href="${esc(att.url)}" target="_blank" rel="noopener">📄 ${esc(att.name||'Archivo')}</a>`;
    }
    const reply=m.replyTo?`<div class="xchat-reply">↩ ${esc(m.replyTo.senderName||'')}: ${esc(m.replyTo.text||'Adjunto')}</div>`:'';
    return `<div class="xchat-msg ${mine?'mine':''}">
      ${reply}<div style="font-weight:800;font-size:12px">${esc(m.senderName||'Usuario')}</div>
      <div>${deleted?'<i class="muted">Mensaje eliminado</i>':linkify(m.text||'')}</div>${attachment}
      <div class="xchat-meta">${fmt(m.createdAt)} ${mine?receiptText(m):''}</div>
      ${!deleted?`<div style="margin-top:5px"><button class="secondary" style="padding:3px 7px;font-size:11px" onclick="xiaraChatReply('${m.id}')">Responder</button>${mine?` <button class="secondary" style="padding:3px 7px;font-size:11px" onclick="xiaraChatDelete('${m.id}')">Eliminar</button>`:''}</div>`:''}
    </div>`;
  }).join('')||'<div class="muted">Sin mensajes.</div>';
  w.scrollTop=w.scrollHeight;
}
async function loadProfile(){
  const p=window.XIARA_PERMISSIONS?.profile;
  if(p){state.profile=p;return p;}
  for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,100));if(window.XIARA_PERMISSIONS?.profile){state.profile=window.XIARA_PERMISSIONS.profile;return state.profile;}}
  return null;
}
async function initFirebase(){
  const {appM,authM,fsM,stM,fnM}=await imports();
  for(let i=0;i<100&&!appM.getApps().length;i++)await new Promise(r=>setTimeout(r,50));
  state.app=appM.getApps()[0];if(!state.app)throw new Error('Firebase no inicializada');
  state.auth=authM.getAuth(state.app);state.fs=fsM.getFirestore(state.app);state.storage=stM.getStorage(state.app);state.fns=fnM.getFunctions(state.app,'us-east1');
  return {authM,fsM};
}
async function heartbeat(){
  if(!uid()||!state.companyId)return;
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  await fm.setDoc(fm.doc(state.fs,'chat_presence',uid()),{
    uid:uid(),empresa_id:state.companyId,name:state.profile?.nombre||state.user?.displayName||state.user?.email||'Usuario',
    email:state.user?.email||'',online:true,lastSeenAt:fm.serverTimestamp(),lastSeenMs:Date.now()
  },{merge:true}).catch(()=>{});
}
async function markOffline(){
  if(!uid())return;
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  await fm.setDoc(fm.doc(state.fs,'chat_presence',uid()),{online:false,lastSeenAt:fm.serverTimestamp(),lastSeenMs:Date.now()},{merge:true}).catch(()=>{});
}
async function subscribePresence(){
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  state.presenceUnsub?.();
  const q=fm.query(fm.collection(state.fs,'chat_presence'),fm.where('empresa_id','==',state.companyId));
  state.presenceUnsub=fm.onSnapshot(q,s=>{
    state.presence.clear();s.forEach(d=>state.presence.set(d.id,d.data()));
    renderConversations();renderHeader();
  },e=>console.warn('presence',e));
}
async function subscribeConversations(){
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  state.convUnsub?.();
  const q=fm.query(
    fm.collection(state.fs,'chat_conversations'),
    fm.where('empresa_id','==',state.companyId),
    fm.where('memberUids','array-contains',uid()),
    fm.orderBy('lastMessageAt','desc'),
    fm.limit(100)
  );
  state.convUnsub=fm.onSnapshot(q,s=>{
    const prevUnread=state.conversations.reduce((n,c)=>n+(c.unreadBy?.[uid()]||0),0);
    state.conversations=s.docs.map(d=>({id:d.id,...d.data()}));
    const nextUnread=state.conversations.reduce((n,c)=>n+(c.unreadBy?.[uid()]||0),0);
    if(nextUnread>prevUnread){playSound();toast('Nuevo mensaje en XIARA Chat');}
    if(state.activeConversation){
      state.activeConversation=state.conversations.find(c=>c.id===state.activeConversation.id)||state.activeConversation;
      renderHeader();
    }
    renderConversations();
    const requested=new URLSearchParams(location.search).get('chat');
    if(requested&&!state.activeConversation&&state.conversations.some(c=>c.id===requested)) openConversation(requested);
  },e=>console.error('chat conversations',e));
}
async function subscribeMessages(cid){
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  state.msgUnsub?.();
  const q=fm.query(fm.collection(state.fs,'chat_conversations',cid,'messages'),fm.orderBy('createdAt','asc'),fm.limitToLast(C.searchWindowSize||300));
  state.msgUnsub=fm.onSnapshot(q,s=>{
    state.messages=s.docs.map(d=>({id:d.id,...d.data()}));
    renderMessages();
    call('chatMarkDelivered',{conversationId:cid}).catch(()=>{});
    if(document.visibilityState==='visible') call('chatMarkRead',{conversationId:cid}).catch(()=>{});
  },e=>console.error('messages',e));
}
async function subscribeTyping(cid){
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  state.typingUnsub?.();
  const q=fm.query(fm.collection(state.fs,'chat_typing'),fm.where('conversationId','==',cid));
  state.typingUnsub=fm.onSnapshot(q,s=>{
    const names=[];s.forEach(d=>{const x=d.data();if(x.uid!==uid() && (x.expiresAtMs||0)>Date.now())names.push(x.name||'Alguien');});
    const w=$('xchatTyping');if(w)w.textContent=names.length?`${names.join(', ')} está escribiendo…`:'';
  });
}
async function openConversation(cid){
  const c=state.conversations.find(x=>x.id===cid);if(!c)return;
  state.activeConversation=c;state.replyTo=null;state.search='';
  if($('xchatMsgSearch'))$('xchatMsgSearch').value='';
  renderConversations();renderHeader();renderReplyBar();
  await subscribeMessages(cid);await subscribeTyping(cid);
  call('chatMarkRead',{conversationId:cid}).catch(()=>{});
}
function renderReplyBar(){
  const w=$('xchatReplyBar');if(!w)return;
  if(!state.replyTo){w.style.display='none';w.innerHTML='';return;}
  w.style.display='block';w.innerHTML=`↩ Respondiendo a <b>${esc(state.replyTo.senderName||'')}</b>: ${esc(state.replyTo.text||'Adjunto')} <button class="secondary" onclick="xiaraChatCancelReply()">Cancelar</button>`;
}
async function uploadAttachment(file,cid,messageId){
  if(!file)return null;
  if(file.size>(C.maxAttachmentBytes||25*1024*1024))throw new Error('Archivo demasiado grande (máximo 25 MB).');
  if(!(C.allowedMime||[]).includes(file.type))throw new Error('Tipo de archivo no permitido.');
  const sm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-storage.js`);
  const safeName=file.name.replace(/[^A-Za-z0-9._-]+/g,'_');
  const path=`chat/${state.companyId}/${cid}/${messageId}/${safeName}`;
  const ref=sm.ref(state.storage,path);
  await sm.uploadBytes(ref,file,{contentType:file.type});
  const url=await sm.getDownloadURL(ref);
  return {name:file.name,mime:file.type,size:file.size,path,url};
}
async function enablePush(){
  if(!('Notification'in window)||!('serviceWorker'in navigator))return alert('Este navegador no admite notificaciones web.');
  const settings=await call('chatGetSettings',{companyId:state.companyId});
  if(!settings?.vapidPublicKey)return alert('Falta configurar la clave Web Push (VAPID). Un Administrador debe abrir Chat Admin.');
  const permission=await Notification.requestPermission();
  if(permission!=='granted')return alert('Permiso de notificaciones no concedido.');
  const reg=await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const mm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-messaging.js`);
  const messaging=mm.getMessaging(state.app);
  const token=await mm.getToken(messaging,{vapidKey:settings.vapidPublicKey,serviceWorkerRegistration:reg});
  if(!token)return alert('No se pudo obtener token push.');
  await call('chatRegisterPush',{token,userAgent:navigator.userAgent,companyId:state.companyId});
  state.messaging=messaging;
  mm.onMessage(messaging,payload=>{playSound();toast(payload?.notification?.title||'Nuevo mensaje');});
  alert('Notificaciones activadas en este dispositivo.');
}
async function adminSettings(){
  if(!window.XIARA_PERMISSIONS?.isAdmin?.())return alert('Solo Administrador.');
  const s=await call('chatGetSettings',{companyId:state.companyId});
  const vapid=prompt('Clave pública VAPID (Firebase Console > Configuración > Cloud Messaging > Web Push):',s?.vapidPublicKey||'');
  if(vapid===null)return;
  const audit=confirm('¿Activar auditoría administrativa de chat para esta empresa?');
  await call('chatSetSettings',{companyId:state.companyId,vapidPublicKey:vapid.trim(),auditAdmin:audit});
  alert('Configuración de Chat guardada.');
}
async function newDirect(){
  const r=await call('chatListPeers',{companyId:state.companyId});
  state.peers=r?.users||[];
  if(!state.peers.length)return alert('No hay otros usuarios disponibles en esta empresa.');

  const rows=state.peers
    .slice()
    .sort((a,b)=>{
      const pa=state.presence.get(a.uid),pb=state.presence.get(b.uid);
      const oa=pa&&isOnline(pa)?1:0,ob=pb&&isOnline(pb)?1:0;
      if(oa!==ob)return ob-oa;
      return String(a.name||a.email||'').localeCompare(String(b.name||b.email||''),'es');
    });

  chatModal(`<h2>Nuevo chat directo</h2>
    <div class="form">
      <input id="xchatPeerSearch" placeholder="Buscar por nombre o email..." oninput="xiaraChatRenderPeerPicker()">
      <div class="muted" style="margin:4px 0 10px">Selecciona a la persona. Puedes abrir el chat aunque esté desconectada; leerá los mensajes cuando vuelva a entrar.</div>
      <div id="xchatPeerPicker" style="max-height:55vh;overflow:auto;border:1px solid #e5e7eb;border-radius:12px"></div>
      <button class="secondary" onclick="xiaraChatCloseModal()">Cancelar</button>
    </div>`);

  window.XIARA_CHAT_PEER_PICKER=rows;
  renderPeerPicker();
}
function renderPeerPicker(){
  const w=$('xchatPeerPicker');if(!w)return;
  const q=($('xchatPeerSearch')?.value||'').trim().toLowerCase();
  const rows=(window.XIARA_CHAT_PEER_PICKER||[]).filter(u=>
    String(u.name||'').toLowerCase().includes(q) ||
    String(u.email||'').toLowerCase().includes(q) ||
    String(u.rol||'').toLowerCase().includes(q)
  );
  w.innerHTML=rows.map(u=>{
    const p=state.presence.get(u.uid);
    const online=!!p&&isOnline(p);
    return `<button type="button" onclick="xiaraChatChoosePeer('${esc(u.uid)}')"
      style="width:100%;display:flex;align-items:center;gap:10px;padding:12px;border:0;border-bottom:1px solid #eef2f7;background:#fff;text-align:left;cursor:pointer">
      <span class="xchat-dot ${online?'online':''}"></span>
      <span style="flex:1;min-width:0">
        <b style="display:block">${esc(u.name||u.email||'Usuario')}</b>
        <span class="muted" style="font-size:12px">${esc(u.email||'')} ${u.rol?'— '+esc(u.rol):''}</span>
      </span>
      <span class="xchat-topbadge">${online?'Disponible':'Desconectado'}</span>
    </button>`;
  }).join('')||'<div class="muted" style="padding:15px">No hay coincidencias.</div>';
}
async function choosePeer(peerUid){
  const peer=state.peers.find(x=>x.uid===peerUid);
  if(!peer)return alert('Usuario no encontrado.');
  try{
    const out=await call('chatEnsureDirect',{companyId:state.companyId,otherUid:peer.uid});
    chatCloseModal();
    await openConversation(out.conversationId);
  }catch(e){
    alert('No se pudo abrir el chat:\n'+(e.message||e));
  }
}
async function newArea(){
  const areas=[
    ['legal','Legal / Laboral'],['rrhh','RRHH'],['finanzas','Finanzas'],['fiscalidad','Fiscalidad'],
    ['compliance','Compliance'],['documental','Documental / OCR'],['socios','Socios'],['agenda','Agenda'],
    ['conferencia','Conferencia'],['firma','Firma'],['informes','Informes']
  ];
  const list=areas.map((x,i)=>`${i+1}. ${x[1]}`).join('\n');
  const n=Number(prompt('Elige área:\n\n'+list));const area=areas[n-1];if(!area)return;
  const out=await call('chatEnsureArea',{companyId:state.companyId,area:area[0],name:`Área ${area[1]}`});
  await openConversation(out.conversationId);
}
async function send(){
  const c=state.activeConversation;if(!c)return alert('Selecciona una conversación.');
  if(!canChat('crear'))return alert('No tienes permiso para enviar mensajes.');
  const text=($('xchatText')?.value||'').trim();
  const file=$('xchatFile')?.files?.[0]||null;
  if(!text&&!file)return;
  const messageId=crypto.randomUUID();
  let attachment=null;
  try{
    if(file){
      if(!canChat('subir'))return alert('No tienes permiso para subir adjuntos al chat.');
      attachment=await uploadAttachment(file,c.id,messageId);
    }
    await call('chatSendMessage',{
      conversationId:c.id,messageId,text,attachment,
      replyTo:state.replyTo?{messageId:state.replyTo.id,senderUid:state.replyTo.senderUid,senderName:state.replyTo.senderName,text:String(state.replyTo.text||'').slice(0,180)}:null
    });
    if($('xchatText'))$('xchatText').value='';
    if($('xchatFile'))$('xchatFile').value='';
    state.replyTo=null;renderReplyBar();
  }catch(e){alert('No se pudo enviar:\n'+(e.message||e));}
}
async function typing(){
  const c=state.activeConversation;if(!c)return;
  clearTimeout(state.typingTimer);
  call('chatTyping',{conversationId:c.id,typing:true}).catch(()=>{});
  state.typingTimer=setTimeout(()=>call('chatTyping',{conversationId:c.id,typing:false}).catch(()=>{}),2500);
}
async function toggleOption(kind){
  const c=state.activeConversation;if(!c)return;
  const arr=kind==='pin'?c.pinnedBy:c.mutedBy;
  const value=!(arr||[]).includes(uid());
  await call('chatSetOption',{conversationId:c.id,option:kind,value});
}
async function deleteMessage(id){
  if(!confirm('¿Eliminar tu mensaje?'))return;
  await call('chatDeleteOwnMessage',{conversationId:state.activeConversation.id,messageId:id});
}
function reply(id){state.replyTo=state.messages.find(x=>x.id===id)||null;renderReplyBar();$('xchatText')?.focus();}
async function validate(){
  const checks=[];
  const add=(n,v,d='')=>checks.push([n,!!v,d]);
  add('Firebase Auth',!!state.user);
  add('Perfil RBAC',!!state.profile);
  add('Empresa activa',!!state.companyId);
  add('Permiso Chat',canChat('ver'));
  add('Firestore',!!state.fs);
  add('Storage',!!state.storage);
  add('Cloud Functions',!!state.fns);
  let health=null;try{health=await call('chatHealth',{companyId:state.companyId});}catch(e){health={ok:false,error:e.message}}
  add('Backend Chat',health?.ok,health?.error||'');
  let s=null;try{s=await call('chatGetSettings',{companyId:state.companyId});}catch(_e){}
  add('VAPID Push configurado',!!s?.vapidPublicKey,'Opcional hasta activar notificaciones');
  add('Service Worker disponible','serviceWorker'in navigator);
  const fatal=checks.filter(x=>!x[1]&&x[0]!=='VAPID Push configurado');
  alert((fatal.length?'CHAT V8 REVISAR':'CHAT V8 APROBADO')+'\n\n'+checks.map(([n,v,d])=>(v?'OK  ':'AVISO  ')+n+(d&&!v?' — '+d:'')).join('\n'));
  return {ok:!fatal.length,checks};
}
async function boot(){
  try{
    const {authM}=await initFirebase();
    authM.onAuthStateChanged(state.auth,async u=>{
      if(!u){state.user=null;return;}
      state.user=u;state.profile=await loadProfile();state.companyId=currentCompany();
      if(!state.companyId||!canChat('ver'))return;
      renderShell();await heartbeat();await subscribePresence();await subscribeConversations();
      clearInterval(state.heartbeat);state.heartbeat=setInterval(heartbeat,C.presenceHeartbeatMs||30000);
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){heartbeat();if(state.activeConversation)call('chatMarkRead',{conversationId:state.activeConversation.id}).catch(()=>{});}else markOffline();});
      window.addEventListener('pagehide',()=>{markOffline();});
    });
  }catch(e){console.error('XIARA Chat init',e);}
}
window.xiaraChatCloseModal=chatCloseModal;
window.xiaraChatRenderConversations=renderConversations;
window.xiaraChatOpen=openConversation;
window.xiaraChatNewDirect=newDirect;
window.xiaraChatRenderPeerPicker=renderPeerPicker;
window.xiaraChatChoosePeer=choosePeer;
window.xiaraChatNewArea=newArea;
window.xiaraChatSend=send;
window.xiaraChatTyping=typing;
window.xiaraChatTogglePin=()=>toggleOption('pin');
window.xiaraChatToggleMute=()=>toggleOption('mute');
window.xiaraChatDelete=deleteMessage;
window.xiaraChatReply=reply;
window.xiaraChatCancelReply=()=>{state.replyTo=null;renderReplyBar();};
window.xiaraChatSearchMessages=()=>{state.search=($('xchatMsgSearch')?.value||'').trim();renderMessages();};
window.xiaraChatEnablePush=enablePush;
window.xiaraChatAdminSettings=adminSettings;
window.xiaraChatValidate=validate;

async function taskAssignableUsers(){
  if(!state.user||!state.companyId)throw new Error('Chat todavía no está listo.');
  const r=await call('chatListPeers',{companyId:state.companyId});
  const peers=r?.users||[];
  const me={
    uid:state.user.uid,
    name:state.profile?.nombre||state.user.displayName||state.user.email||'Usuario',
    email:state.user.email||'',
    role:state.profile?.rol||''
  };
  return [me,...peers].filter((x,i,a)=>x?.uid&&a.findIndex(y=>y.uid===x.uid)===i)
    .sort((a,b)=>String(a.name||a.email||'').localeCompare(String(b.name||b.email||''),'es'));
}
async function assignTaskNotification(payload){
  if(!state.user||!state.companyId)throw new Error('Chat todavía no está listo.');
  return await call('chatAssignTask',{
    companyId:state.companyId,
    taskId:String(payload?.taskId||''),
    title:String(payload?.title||''),
    description:String(payload?.description||''),
    dueDate:String(payload?.dueDate||''),
    priority:String(payload?.priority||'Media'),
    recipientUids:Array.isArray(payload?.recipientUids)?payload.recipientUids:[]
  });
}

window.XIARA_CHAT={version:'8.1.6-task-notices',state,open:openConversation,validate,getAssignableUsers:taskAssignableUsers,assignTask:assignTaskNotification};
window.addEventListener('DOMContentLoaded',()=>{setTimeout(boot,200);});
})();

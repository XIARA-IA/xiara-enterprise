/* XIARA V7.1 RBAC granular */
(function(){
'use strict';
const FB='10.12.5',REGION='us-east1';
const MOD=[['dashboard','Dashboard'],['notificaciones','Notificaciones'],['chat','Chat interno'],['legal','Legal / Laboral'],['finanzas','Finanzas'],['fiscalidad','Fiscalidad'],['compliance','Compliance / Riesgo'],['documental','Control Documental / OCR'],['rrhh','RRHH'],['socios','Socios / Gobierno'],['conferencia','Conferencia'],['agenda','Agenda / Tareas'],['firma','Firma Digital'],['informes','Informes'],['empresas','Empresas'],['usuarios','Usuarios'],['config','Configuración']];
const ACT=[['ver','Ver'],['crear','Crear'],['editar','Editar'],['borrar','Borrar'],['subir','Subir docs'],['descargar','Descargar']];
const NAV={dashboard:'dashboard',notificaciones:'notificaciones',chat:'chat',laborales:'legal',finanzas:'finanzas',fiscalidad:'fiscalidad',compliance:'compliance',documentos:'documental',rrhh:'rrhh',socios:'socios',conferencia:'conferencia',agenda:'agenda',firmaDigital:'firma',informes:'informes',empresas:'empresas',usuarios:'usuarios',config:'config'};
const COL={empresas:'empresas',usuarios:'usuarios',notificaciones:'notificaciones',chat_conversations:'chat',chat_presence:'chat',laborales:'legal',casosJudiciales:'legal',conciliaciones:'legal',jurisprudencia:'legal',plantillas:'legal',finanzas:'finanzas',facturas:'finanzas',modelos:'fiscalidad',compliance:'compliance',rrhh:'rrhh',centrosTrabajo:'rrhh',cargasSociales:'rrhh',cartasPago:'finanzas',documentos:'documental',socios:'socios',audit:'config'};
let auth,fs,fns,profile,users=[],sessionUnsub=null,currentSessionId=null,presenceUnsub=null,presenceTimer=null,presenceMap=new Map();
function empty(){return Object.fromEntries(MOD.map(([m])=>[m,Object.fromEntries(ACT.map(([a])=>[a,false]))]));}
function fill(v){return Object.fromEntries(MOD.map(([m])=>[m,Object.fromEntries(ACT.map(([a])=>[a,!!v]))]));}
function preset(map){const p=empty();Object.entries(map||{}).forEach(([m,aa])=>(aa||[]).forEach(a=>{if(p[m])p[m][a]=true;}));return p;}
const PRE={Administrador:()=>fill(true),'Responsable Legal':()=>preset({dashboard:['ver'],chat:['ver','crear','subir','descargar'],legal:['ver','crear','editar','subir','descargar'],rrhh:['ver','descargar'],documental:['ver','subir','descargar']}),RRHH:()=>preset({dashboard:['ver'],chat:['ver','crear','subir','descargar'],rrhh:['ver','crear','editar','subir','descargar'],documental:['ver','subir','descargar']}),'Finanzas / Fiscal':()=>preset({dashboard:['ver'],chat:['ver','crear','subir','descargar'],finanzas:['ver','crear','editar','subir','descargar'],fiscalidad:['ver','crear','editar','subir','descargar']}),'Auditor solo lectura':()=>preset(Object.fromEntries(MOD.filter(x=>!['usuarios','config'].includes(x[0])).map(([m])=>[m,['ver','descargar']]))),Personalizado:()=>preset({dashboard:['ver']})};
function isAdmin(){
 return !!profile && profile.activo!==false &&
   String(profile.rol||'').toLowerCase()==='administrador';
}
function norm(raw){const p=empty();MOD.forEach(([m])=>{ACT.forEach(([a])=>p[m][a]=!!raw?.[m]?.[a]);if(Object.entries(p[m]).some(([a,v])=>a!=='ver'&&v))p[m].ver=true;});return p;}
function admin(){return !!profile&&profile.activo!==false&&String(profile.rol||'').toLowerCase()==='administrador';}
function can(m,a='ver'){if(!profile||profile.activo===false)return false;if(admin())return true;return !!profile.permisos?.[m]?.[a];}
function modOf(id){return NAV[id]||id||'dashboard';}function cur(){return modOf(document.querySelector('.section.active')?.id||'dashboard');}function canCur(a='ver'){return can(cur(),a);}function companyAllowed(id){return admin()||!!id&&profile?.empresas?.includes(id);}function canCol(c,a='ver'){return !!COL[c]&&can(COL[c],a);}function company(){return document.getElementById('companySel')?.value||window.XIARA_CONTEXT_API?.getCompanyId?.()||null;}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function action(el){const s=((el?.textContent||'')+' '+(el?.getAttribute?.('onclick')||'')).toLowerCase();if(/eliminar|borrar|delete|remove/.test(s))return'borrar';if(/subir|upload|adjuntar|scan|escanear|importar/.test(s))return'subir';if(/descargar|download/.test(s))return'descargar';if(/crear|nuevo|nueva|añadir|agregar|create|add/.test(s))return'crear';if(/guardar|editar|actualizar|firmar|aprobar|rechazar|save|edit|update|sign/.test(s))return'editar';return'ver';}
function modal(h){const b=document.getElementById('modalBox'),m=document.getElementById('modal');if(!b||!m)return alert('Modal no disponible');b.innerHTML=h;m.classList.add('open');}function close(){window.closeModal?.();}
async function call(name,data={}){const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-functions.js`);return(await fm.httpsCallable(fns,name)(data)).data;}
function grid(p){return `<div style="overflow:auto;max-height:55vh"><table style="width:100%"><thead><tr><th style="text-align:left">Área</th>${ACT.map(([,l])=>`<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>${MOD.map(([m,l])=>`<tr><td style="font-weight:800">${esc(l)}</td>${ACT.map(([a])=>`<td style="text-align:center"><input type="checkbox" data-rbac="${m}.${a}" ${p?.[m]?.[a]?'checked':''}></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function readGrid(){const p=empty();document.querySelectorAll('[data-rbac]').forEach(x=>{const[m,a]=x.dataset.rbac.split('.');if(p[m])p[m][a]=x.checked;});return norm(p);}function usePreset(n){const p=(PRE[n]||PRE.Personalizado)();document.querySelectorAll('[data-rbac]').forEach(x=>{const[m,a]=x.dataset.rbac.split('.');x.checked=!!p?.[m]?.[a];});}
function nav(){document.querySelectorAll('#nav button[data-s]').forEach(b=>b.style.display=can(modOf(b.dataset.s),'ver')?'':'none');const u=document.getElementById('userSel');if(u)u.style.display='none';const cs=document.getElementById('companySel');if(cs&&!admin())[...cs.options].forEach(o=>{if(!companyAllowed(o.value))o.remove();});const n=document.getElementById('sessionName'),r=document.getElementById('sessionRole');if(n)n.textContent=profile?.nombre||profile?.email||'Usuario';if(r)r.textContent=profile?.rol||'Personalizado';const a=document.querySelector('.section.active');if(a&&!can(modOf(a.id),'ver'))document.querySelector('#nav button[data-s="dashboard"]')?.click();}
function sanitize(){if(admin())return;const db=window.XIARA_CONTEXT_API?.getDb?.();if(!db)return;const g={notificaciones:['notificaciones'],legal:['laborales','casosJudiciales','conciliaciones','jurisprudencia','plantillas'],finanzas:['finanzas','facturas','cartasPago'],fiscalidad:['modelos'],compliance:['compliance'],documental:['documentos'],rrhh:['rrhh','centrosTrabajo','cargasSociales'],socios:['socios']};Object.entries(g).forEach(([m,ks])=>{if(!can(m,'ver'))ks.forEach(k=>{if(Array.isArray(db[k]))db[k]=[];});});try{window.XIARA_CONTEXT_API?.safeLocalSave?.();}catch(_e){}}
function hideLegacyUserManager(){
 const sec=document.getElementById('usuarios');
 const panel=document.getElementById('xiaraRbacPanel');
 if(!sec||!panel)return;
 [...sec.children].forEach(el=>{if(el!==panel)el.style.display='none';});
}

function xiaraPresenceDate(v){
 try{
  const d=v?.toDate?v.toDate():new Date(v);
  if(!d||!Number.isFinite(d.getTime()))return '';
  return d.toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 }catch(_e){return '';}
}
function xiaraPresenceIsOnline(s){
 if(!s||s.closedAt)return false;
 const d=s.lastSeenAt?.toDate?s.lastSeenAt.toDate():s.startedAt?.toDate?s.startedAt.toDate():new Date(s.lastSeenAt||s.startedAt||0);
 if(!d||!Number.isFinite(d.getTime()))return false;
 return Date.now()-d.getTime()<=90000;
}
function xiaraPresenceCell(uid){
 const s=presenceMap.get(uid);
 const online=xiaraPresenceIsOnline(s);
 const last=xiaraPresenceDate(s?.lastSeenAt||s?.startedAt);
 return `<div style="display:flex;align-items:center;gap:7px;min-width:145px">
  <span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:${online?'#22c55e':'#94a3b8'}"></span>
  <div><b>${online?'Conectado':'No conectado'}</b>${last?`<br><span class="muted" style="font-size:11px">${online?'Activo':'Última actividad'}: ${esc(last)}</span>`:''}</div>
 </div>`;
}
function xiaraRenderUsersTable(){
 const w=document.getElementById('xiaraRbacUsers'),st=document.getElementById('xiaraRbacStatus');
 if(st)st.textContent=`${users.length} usuario(s) Firebase`;
 if(!w)return;
 w.innerHTML=`<div style="overflow:auto"><table style="width:100%">
 <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Empresas</th><th>Estado</th><th>Conexión</th><th></th></tr>
 ${users.map(u=>`<tr>
  <td>${esc(u.displayName||u.access?.nombre||'')}</td>
  <td>${esc(u.email||'')}</td>
  <td>${esc(u.access?.rol||'Sin perfil')}</td>
  <td>${esc((u.access?.empresas||[]).join(', '))}</td>
  <td>${u.disabled||u.access?.activo===false?'⛔':'✅'}</td>
  <td>${xiaraPresenceCell(u.uid)}</td>
  <td><button class="secondary" onclick="xiaraRbacEditUser('${u.uid}')">Permisos</button>
      <button class="secondary" onclick="xiaraRbacForceLogout('${u.uid}','${esc(u.email||'')}')">Cerrar sesión</button>
      <button class="danger" onclick="xiaraRbacToggleUser('${u.uid}',${u.disabled?'false':'true'})">${u.disabled?'Activar':'Desactivar'}</button></td>
 </tr>`).join('')}</table></div>`;
}
async function xiaraStartAdminPresenceWatch(){
 if(!fs||!admin()||presenceUnsub)return;
 const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
 presenceUnsub=fm.onSnapshot(fm.collection(fs,'xiara_sessions'),snap=>{
  presenceMap=new Map();
  snap.forEach(d=>presenceMap.set(d.id,d.data()||{}));
  xiaraRenderUsersTable();
 },e=>console.warn('XIARA admin presence watch',e));
}
async function xiaraHeartbeat(){
 if(!auth?.currentUser||!fs||!currentSessionId)return;
 try{
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  await fm.setDoc(fm.doc(fs,'xiara_sessions',auth.currentUser.uid),{
   uid:auth.currentUser.uid,email:auth.currentUser.email||'',
   sessionId:currentSessionId,lastSeenAt:fm.serverTimestamp(),closedAt:null,updatedAt:fm.serverTimestamp()
  },{merge:true});
 }catch(e){console.warn('XIARA heartbeat',e);}
}
function xiaraStartHeartbeat(){
 if(presenceTimer)clearInterval(presenceTimer);
 xiaraHeartbeat();
 presenceTimer=setInterval(xiaraHeartbeat,30000);
}
async function xiaraMarkOffline(){
 if(presenceTimer){clearInterval(presenceTimer);presenceTimer=null;}
 if(!auth?.currentUser||!fs||!currentSessionId)return;
 try{
  const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
  await fm.setDoc(fm.doc(fs,'xiara_sessions',auth.currentUser.uid),{
   uid:auth.currentUser.uid,sessionId:currentSessionId,
   closedAt:fm.serverTimestamp(),lastSeenAt:fm.serverTimestamp(),updatedAt:fm.serverTimestamp()
  },{merge:true});
 }catch(_e){}
}

function panel(){const s=document.getElementById('usuarios');if(!s||!admin())return;if(document.getElementById('xiaraRbacPanel'))return;s.insertAdjacentHTML('afterbegin',`<div id="xiaraRbacPanel" class="card" style="border:2px solid #6c4cf5;margin-bottom:12px"><h3>🔐 Usuarios y permisos V7.1</h3><p class="muted">Checklist por empresa, área y acción.</p><button onclick="xiaraRbacOpenUser()">+ Crear usuario</button> <button class="secondary" onclick="xiaraRbacRefreshUsers()">Actualizar</button> <button class="secondary" onclick="xiaraRbacSelfTest()">VALIDAR PERMISOS V7.1</button><div id="xiaraRbacStatus" class="muted"></div><div id="xiaraRbacUsers"></div></div>`);loadUsers();setTimeout(hideLegacyUserManager,0);}
async function loadUsers(){
 if(!admin())return[];
 try{
  const r=await call('adminListXiaraUsers');
  users=r?.users||[];
  xiaraRenderUsersTable();
  xiaraStartAdminPresenceWatch().catch(console.warn);
  return users;
 }catch(e){
  const st=document.getElementById('xiaraRbacStatus');
  if(st)st.textContent='Error: '+(e.message||e);
  return[];
 }
}
window.xiaraRbacRefreshUsers=loadUsers;window.xiaraRbacApplyPreset=usePreset;
window.xiaraRbacOpenUser=function(){
 if(!profile){
   return alert('El perfil de permisos todavía se está cargando. Pulsa Actualizar y vuelve a intentarlo.');
 }
 if(!admin()) return alert('Solo Administrador puede crear usuarios.');
 const co=company()||profile?.empresas?.[0]||'';
 const role='Responsable Legal';
 const roleOptions=Object.keys(PRE).map(x=>`<option ${x===role?'selected':''}>${esc(x)}</option>`).join('');
 modal(`<h2>Crear usuario Firebase + permisos</h2>
   <div class="form">
     <label>Nombre<input id="rbac_name" placeholder="Nombre y apellidos"></label>
     <label>Email<input id="rbac_email" type="email" placeholder="usuario@empresa.com"></label>
     <label>Empresa<input id="rbac_company" value="${esc(co)}" placeholder="EMP-BUDDY"></label>
     <label>Perfil base
       <select id="rbac_role" onchange="xiaraRbacApplyPreset(this.value)">
         ${roleOptions}
       </select>
     </label>
     <div class="card" style="margin-top:10px">
       <b>Checklist de permisos por área y acción</b>
       <p class="muted">Marca exactamente lo que este usuario puede hacer.</p>
       ${grid(PRE[role]())}
     </div>
     <button onclick="xiaraRbacCreateUser()">Crear usuario Firebase</button>
   </div>`);
};
window.xiaraRbacCreateUser=async function(){const displayName=document.getElementById('rbac_name')?.value.trim(),email=document.getElementById('rbac_email')?.value.trim(),co=document.getElementById('rbac_company')?.value.trim(),rol=document.getElementById('rbac_role')?.value||'Personalizado';if(!displayName||!email||!co)return alert('Completa nombre, email y empresa.');try{const r=await call('adminCreateXiaraUser',{email,displayName,rol,empresas:[co],permisos:readGrid()});let sent=false;try{const am=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`);await am.sendPasswordResetEmail(auth,email);sent=true;}catch(_e){}close();await loadUsers();alert('Usuario creado.\n'+(sent?'Correo para contraseña enviado.':'Correo automático no enviado.')+(r?.resetLink?'\n\nEnlace alternativo:\n'+r.resetLink:''));}catch(e){alert('Error: '+(e.message||e));}};
window.xiaraRbacEditUser=function(uid){const u=users.find(x=>x.uid===uid);if(!u)return;const a=u.access||{};modal(`<h2>Permisos de ${esc(u.displayName||u.email)}</h2><div class="form"><input id="rbac_edit_name" value="${esc(u.displayName||a.nombre||'')}"><input value="${esc(u.email||'')}" disabled><label>Rol<select id="rbac_edit_role" onchange="xiaraRbacApplyPreset(this.value)">${Object.keys(PRE).map(x=>`<option ${x===(a.rol||'Personalizado')?'selected':''}>${esc(x)}</option>`).join('')}</select></label><input id="rbac_edit_companies" value="${esc((a.empresas||[]).join(','))}" placeholder="EMPRESA1,EMPRESA2"><label><input id="rbac_edit_active" type="checkbox" ${a.activo===false?'':'checked'}> Activo</label><div class="card">${grid(norm(a.permisos||{}))}</div><button onclick="xiaraRbacSaveUser('${uid}')">Guardar permisos</button></div>`);};
window.xiaraRbacSaveUser=async function(uid){const displayName=document.getElementById('rbac_edit_name')?.value.trim(),rol=document.getElementById('rbac_edit_role')?.value||'Personalizado',empresas=(document.getElementById('rbac_edit_companies')?.value||'').split(',').map(x=>x.trim()).filter(Boolean),activo=!!document.getElementById('rbac_edit_active')?.checked;if(!empresas.length)return alert('Debe tener una empresa.');try{await call('adminUpdateXiaraAccess',{uid,displayName,rol,empresas,activo,permisos:readGrid()});close();await loadUsers();alert('Permisos actualizados.');}catch(e){alert(e.message||e);}};
window.xiaraRbacToggleUser=async function(uid,disabled){if(!confirm(disabled?'¿Desactivar usuario?':'¿Activar usuario?'))return;try{await call('adminSetXiaraUserDisabled',{uid,disabled});await loadUsers();}catch(e){alert(e.message||e);}};
window.xiaraRbacForceLogout=async function(uid,email){
 if(!confirm(`¿Cerrar inmediatamente la sesión de ${email||'este usuario'} en todos sus dispositivos?`))return;
 try{
  await call('adminForceXiaraLogout',{uid});
  alert('Sesión cerrada. El usuario tendrá que volver a iniciar sesión.');
  await loadUsers();
 }catch(e){alert(e.message||e);}
};
window.xiaraRbacSelfTest=async function(){const c=[['Perfil',!!profile],['Activo',profile?.activo!==false],['Empresa',companyAllowed(company())],['Firestore',!!window.XIARA?.dbService],['Storage',!!window.XIARA?.storageService],['Functions',!!fns],['Guard',window.XIARA_PERMISSION_READY===true]];alert((c.every(x=>x[1])?'PERMISOS V7.1 OK':'PERMISOS V7.1 REVISAR')+'\n\n'+c.map(([n,v])=>(v?'OK  ':'FALLO  ')+n).join('\n'));return c;};
async function xiaraStopSessionWatch(){
 try{sessionUnsub?.();}catch(_e){}
 sessionUnsub=null;
 if(presenceTimer){clearInterval(presenceTimer);presenceTimer=null;}
 currentSessionId=null;
}
async function xiaraStartExclusiveSession(u){
 const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
 const am=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`);
 await xiaraStopSessionWatch();

 const sessionId=(globalThis.crypto?.randomUUID?.()||('SES-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
 const sessionRef=fm.doc(fs,'xiara_sessions',u.uid);
 const accessRef=fm.doc(fs,'access',u.uid);

 await fm.setDoc(sessionRef,{
   uid:u.uid,
   email:u.email||'',
   sessionId,
   startedAt:fm.serverTimestamp(),
   lastSeenAt:fm.serverTimestamp(),
   device:String(navigator.userAgent||'Navegador').slice(0,180),
   closedAt:null,
   closedBy:null,
   updatedAt:fm.serverTimestamp()
 },{merge:true});

 currentSessionId=sessionId;
 xiaraStartHeartbeat();

 const unsubSession=fm.onSnapshot(sessionRef,s=>{
  if(!s.exists())return;
  const d=s.data()||{};
  if(currentSessionId && d.sessionId && d.sessionId!==currentSessionId){
   currentSessionId=null;
   am.signOut(auth).finally(()=>alert('Tu sesión se cerró porque este usuario inició sesión en otro dispositivo o un Administrador cerró la sesión.'));
  }
 },e=>console.warn('XIARA session watch',e));

 const unsubAccess=fm.onSnapshot(accessRef,s=>{
  if(!s.exists())return;
  const d=s.data()||{};
  if(d.activo===false){
   currentSessionId=null;
   am.signOut(auth).finally(()=>alert('Tu usuario ha sido deshabilitado por un Administrador.'));
  }
 },e=>console.warn('XIARA access watch',e));

 sessionUnsub=()=>{
  try{unsubSession?.();}catch(_e){}
  try{unsubAccess?.();}catch(_e){}
 };
 return sessionId;
}
async function loadProfile(u){
 const fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`);
 const s=await fm.getDoc(fm.doc(fs,'access',u.uid)),d=s.exists()?s.data():null;
 profile=d?{
  uid:u.uid,email:u.email,nombre:d.nombre||u.displayName||u.email,activo:d.activo!==false,
  rol:d.rol||'Personalizado',empresas:Array.isArray(d.empresas)?d.empresas:[],
  permisos:norm(d.permisos||{}),sessionId:d.sessionId||null
 }:{uid:u.uid,email:u.email,nombre:u.email,activo:false,rol:'Sin acceso',empresas:[],permisos:empty()};
 window.XIARA_PERMISSIONS.profile=profile;
 window.XIARA_PERMISSIONS.loaded=true;
 window.XIARA_PERMISSION_READY=true;
 if(profile.activo===false){
  const am=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`);
  await am.signOut(auth);alert('Este usuario está deshabilitado.');return;
 }
 try{window.xiaraBindAuthenticatedUser?.(u,profile);}catch(_e){}
 try{await xiaraStartExclusiveSession(u);}
 catch(e){
  console.error('XIARA exclusive session',e);
  const am=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`);
  await am.signOut(auth);
  alert('No se pudo establecer la sesión segura: '+(e.message||e));return;
 }
 nav();sanitize();setTimeout(panel,100);
 try{window.xiaraStartSnapshots?.();}catch(_e){}
}
async function init(){
 const ap=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-app.js`),
       am=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`),
       fm=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`),
       fn=await import(`https://www.gstatic.com/firebasejs/${FB}/firebase-functions.js`);
 for(let i=0;i<100&&!ap.getApps().length;i++)await new Promise(r=>setTimeout(r,50));
 const app=ap.getApps()[0];if(!app)throw new Error('Firebase no inicializada');
 auth=am.getAuth(app);fs=fm.getFirestore(app);fns=fn.getFunctions(app,REGION);
 am.onAuthStateChanged(auth,u=>{
  if(u)loadProfile(u).catch(console.error);
  else{
   xiaraStopSessionWatch();
   profile=null;
   window.XIARA_PERMISSIONS.profile=null;
   window.XIARA_PERMISSIONS.loaded=false;
   window.XIARA_PERMISSION_READY=false;
  }
 });
}
window.XIARA_SESSION_API={stop:xiaraStopSessionWatch,markOffline:xiaraMarkOffline,get sessionId(){return currentSessionId;}};
window.addEventListener('pagehide',()=>{xiaraMarkOffline().catch(()=>{});});
window.xiaraRbacIsAdmin=()=>isAdmin();
window.XIARA_PERMISSIONS={version:'8.1.4-user-presence',loaded:false,profile:null,isAdmin:admin,can,canCurrent:canCur,companyAllowed,canCollection:canCol,currentModule:cur};
document.addEventListener('click',e=>{if(!window.XIARA_PERMISSIONS?.loaded)return;const n=e.target.closest?.('#nav button[data-s]');if(n&&!can(modOf(n.dataset.s),'ver')){e.preventDefault();e.stopImmediatePropagation();return alert('No tienes permiso para ver esta área.');}const a=e.target.closest?.('button,a');if(!a||a.closest?.('#nav'))return;const s=a.closest?.('.section');if(!s)return;const m=modOf(s.id),ac=action(a);if(!can(m,ac)){e.preventDefault();e.stopImmediatePropagation();alert('Permiso denegado: '+ac+' en '+m+'.');}},true);
const mo=new MutationObserver(()=>{if(!window.XIARA_PERMISSIONS?.loaded)return;clearTimeout(mo._t);mo._t=setTimeout(()=>{nav();panel();hideLegacyUserManager();},60);});window.addEventListener('DOMContentLoaded',()=>{mo.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});init().catch(console.error);});
})();

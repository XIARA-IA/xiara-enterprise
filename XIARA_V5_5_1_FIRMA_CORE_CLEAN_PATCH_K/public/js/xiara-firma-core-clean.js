(function(){
  'use strict';
  var VERSION='V5.5.1 FIRMA CORE CLEAN PATCH K';
  var CARD_ID='xiara_firma_core_clean_card_k';
  var OVERLAY_ID='xiara_firma_core_clean_overlay_k';
  var KEY_PREFIX='xiara_v551_firma_core_clean_';

  function log(){ try{ console.log.apply(console, ['✓ XIARA '+VERSION+' cargado'].concat([].slice.call(arguments))); }catch(_){ } }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
  function now(){ try{ if(typeof window.now==='function') return window.now(); }catch(_){ } return new Date().toISOString(); }
  function activeCompanyId(){ try{return String(window.activeCompany || (typeof window.company==='function' && window.company() && (window.company().id||window.company().nombre)) || 'global');}catch(_){return 'global';} }
  function userObj(){ try{return (typeof window.user==='function' && window.user()) || {};}catch(_){return {};} }
  function userKey(){ var u=userObj(); return String(u.email||u.username||u.nombre||u.id||'administrador').toLowerCase().replace(/[^a-z0-9._-]+/g,'_'); }
  function userName(){ var u=userObj(); return String(u.nombre||u.username||u.email||'Administrador'); }
  function dbRoot(){ window.db=window.db||{}; return window.db; }
  function store(){
    var db=dbRoot();
    db.xiaraFirmaSello=db.xiaraFirmaSello||{};
    db.xiaraFirmaSello.empresas=db.xiaraFirmaSello.empresas||{};
    var cid=activeCompanyId();
    db.xiaraFirmaSello.empresas[cid]=db.xiaraFirmaSello.empresas[cid]||{};
    var st=db.xiaraFirmaSello.empresas[cid];
    st.userFirmas=st.userFirmas||{};
    // Compatibilidad con módulos viejos que leen en raíz.
    if(db.xiaraFirmaSello.firmaDataUrl && !st.firmaEmpresaDataUrl) st.firmaEmpresaDataUrl=db.xiaraFirmaSello.firmaDataUrl;
    if(db.xiaraFirmaSello.selloDataUrl && !st.selloOficialDataUrl) st.selloOficialDataUrl=db.xiaraFirmaSello.selloDataUrl;
    return st;
  }
  function getFirma(){ var st=store(), uf=st.userFirmas[userKey()]||{}; return uf.dataUrl || st.firmaPersonalDataUrl || st.firmaEmpresaDataUrl || st.firmaDataUrl || ''; }
  function getSello(){ var st=store(); return st.selloOficialDataUrl || st.selloDataUrl || st.selloTemporalDataUrl || ''; }
  function setFirma(data, name){
    if(!data) return false;
    var st=store(), key=userKey();
    st.userFirmas[key]={dataUrl:data,name:name||'firma.png',usuario:userName(),userKey:key,updatedAt:now()};
    st.firmaPersonalDataUrl=data;
    st.firmaEmpresaDataUrl=data;
    st.firmaEmpresaUsuario=userName();
    st.firmaEmpresaUpdatedAt=now();
    var db=dbRoot(); db.xiaraFirmaSello.firmaDataUrl=data; db.xiaraFirmaSello.firmaEmpresaDataUrl=data;
    try{ localStorage.setItem(KEY_PREFIX+'firma_'+activeCompanyId()+'_'+key, JSON.stringify(st.userFirmas[key])); }catch(e){ console.warn('No se pudo guardar firma ligera',e); }
    safeSave();
    return true;
  }
  function setSello(data, name){
    if(!data) return false;
    var st=store();
    st.selloOficialDataUrl=data; st.selloDataUrl=data; st.selloOficialFileName=name||'sello.png'; st.selloUpdatedAt=now();
    var db=dbRoot(); db.xiaraFirmaSello.selloDataUrl=data; db.xiaraFirmaSello.selloOficialDataUrl=data;
    try{ localStorage.setItem(KEY_PREFIX+'sello_'+activeCompanyId(), JSON.stringify({dataUrl:data,name:name||'sello.png',updatedAt:now()})); }catch(e){ console.warn('No se pudo guardar sello ligero',e); }
    safeSave();
    return true;
  }
  function restoreLight(){
    try{
      var k=KEY_PREFIX+'firma_'+activeCompanyId()+'_'+userKey();
      var f=JSON.parse(localStorage.getItem(k)||'null');
      if(f && f.dataUrl && !getFirma()) setFirma(f.dataUrl,f.name);
    }catch(_){ }
    try{
      var s=JSON.parse(localStorage.getItem(KEY_PREFIX+'sello_'+activeCompanyId())||'null');
      if(s && s.dataUrl && !getSello()) setSello(s.dataUrl,s.name);
    }catch(_){ }
  }
  function safeSave(){ try{ if(typeof window.localSave==='function') window.localSave(); }catch(e){ console.warn('XIARA firma clean save:',e); } }
  function safeRender(){
    try{ renderPanel(true); }catch(_){ }
    try{ if(typeof window.xiaraRenderPRLDoc==='function') setTimeout(function(){window.xiaraRenderPRLDoc();},50); }catch(_){ }
  }
  function imgHtml(src){ return src ? '<img src="'+src+'" style="max-width:240px;max-height:110px;border:1px solid #dbeafe;border-radius:12px;background:#fff;padding:8px;object-fit:contain">' : '<span class="muted">Sin registrar.</span>'; }
  function renderPanel(force){
    var el=document.getElementById('firmaDigital'); if(!el) return;
    restoreLight();
    var existing=document.getElementById(CARD_ID);
    var html='';
    html+='<div class="card xiara-firma-clean-card" id="'+CARD_ID+'" style="margin-top:16px;border:1px solid #c7d2fe;background:#eef2ff">';
    html+='<h3>🔐 Firma y sello oficial XIARA V5.5.1 CLEAN</h3>';
    html+='<p class="muted">Panel limpio y estable. Guarda firma personal y sello oficial para documentos PRL, EPI, RRHH y legales.</p>';
    html+='<div class="report-buttons" style="margin-bottom:12px">';
    html+='<button type="button" id="xiara_clean_btn_firma">✍️ Cargar / cambiar firma</button>';
    html+='<button type="button" id="xiara_clean_btn_sello" class="secondary">🏛️ Cargar / cambiar sello</button>';
    html+='<button type="button" id="xiara_clean_btn_refresh" class="secondary">Actualizar vista</button>';
    html+='</div>';
    html+='<div class="grid two">';
    html+='<div><b>Firma de '+esc(userName())+'</b><div style="margin-top:8px">'+imgHtml(getFirma())+'</div></div>';
    html+='<div><b>Sello empresa</b><div style="margin-top:8px">'+imgHtml(getSello())+'</div></div>';
    html+='</div></div>';
    if(existing){ existing.outerHTML=html; }
    else{
      var first=el.querySelector('.card');
      if(first) first.insertAdjacentHTML('beforebegin', html); else el.insertAdjacentHTML('afterbegin', html);
    }
    bindPanelButtons();
  }
  function bindPanelButtons(){
    var f=document.getElementById('xiara_clean_btn_firma'); if(f) f.onclick=function(ev){ev.preventDefault(); openFirma();};
    var s=document.getElementById('xiara_clean_btn_sello'); if(s) s.onclick=function(ev){ev.preventDefault(); openSello();};
    var r=document.getElementById('xiara_clean_btn_refresh'); if(r) r.onclick=function(ev){ev.preventDefault(); renderPanel(true);};
  }
  function closeOverlay(){ var o=document.getElementById(OVERLAY_ID); if(o) o.remove(); }
  function overlayBase(title, body){
    closeOverlay();
    var html='';
    html+='<div id="'+OVERLAY_ID+'" style="position:fixed;inset:0;background:rgba(15,23,42,.72);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px">';
    html+='<div style="width:min(980px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.35);color:#0f172a">';
    html+='<button type="button" id="xiara_clean_close" style="float:right;border:0;background:#ef4444;color:white;border-radius:12px;padding:8px 12px;font-weight:800">X</button>';
    html+='<h2 style="margin-top:0">'+esc(title)+'</h2>'+body+'</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('xiara_clean_close').onclick=closeOverlay;
  }
  function openFirma(){
    var body='';
    body+='<p>Firma con mouse, dedo, pantalla táctil o lápiz óptico. También puedes subir una imagen.</p>';
    body+='<canvas id="xiara_clean_canvas" width="900" height="280" style="width:100%;height:280px;border:2px dashed #94a3b8;border-radius:16px;background:white;touch-action:none"></canvas>';
    body+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button type="button" id="xiara_clean_clear">Limpiar</button><button type="button" id="xiara_clean_save_firma">Guardar firma dibujada</button><input id="xiara_clean_firma_file" type="file" accept="image/*"><button type="button" id="xiara_clean_save_firma_file">Guardar imagen subida</button></div>';
    overlayBase('Firma personal', body);
    initCanvas(document.getElementById('xiara_clean_canvas'));
    document.getElementById('xiara_clean_clear').onclick=function(){ var c=document.getElementById('xiara_clean_canvas'); c.getContext('2d').clearRect(0,0,c.width,c.height); };
    document.getElementById('xiara_clean_save_firma').onclick=function(){ var c=document.getElementById('xiara_clean_canvas'); setFirma(c.toDataURL('image/png'),'firma_dibujada.png'); closeOverlay(); renderPanel(true); alert('Firma guardada y visible en el panel.'); };
    document.getElementById('xiara_clean_save_firma_file').onclick=function(){ var file=document.getElementById('xiara_clean_firma_file').files[0]; if(!file) return alert('Selecciona una imagen de firma.'); readFile(file,function(data){ setFirma(data,file.name); closeOverlay(); renderPanel(true); alert('Firma subida y visible en el panel.'); }); };
  }
  function openSello(){
    var body='';
    body+='<p>Sube el sello oficial de la empresa en JPG o PNG.</p>';
    body+='<input id="xiara_clean_sello_file" type="file" accept="image/*"><div style="margin-top:12px"><button type="button" id="xiara_clean_save_sello">Guardar sello oficial</button></div>';
    overlayBase('Sello oficial de empresa', body);
    document.getElementById('xiara_clean_save_sello').onclick=function(){ var file=document.getElementById('xiara_clean_sello_file').files[0]; if(!file) return alert('Selecciona una imagen de sello.'); readFile(file,function(data){ setSello(data,file.name); closeOverlay(); renderPanel(true); alert('Sello guardado y visible en el panel.'); }); };
  }
  function readFile(file, cb){ var fr=new FileReader(); fr.onload=function(){ cb(fr.result); }; fr.readAsDataURL(file); }
  function initCanvas(canvas){
    if(!canvas) return; var ctx=canvas.getContext('2d'), drawing=false, last=null;
    ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#0f172a';
    function pos(ev){ var e=ev.touches&&ev.touches[0]?ev.touches[0]:ev; var r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*(canvas.width/r.width), y:(e.clientY-r.top)*(canvas.height/r.height)}; }
    function down(ev){ ev.preventDefault(); drawing=true; last=pos(ev); }
    function move(ev){ if(!drawing) return; ev.preventDefault(); var p=pos(ev); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; }
    function up(ev){ if(ev) ev.preventDefault(); drawing=false; last=null; }
    canvas.addEventListener('mousedown',down); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    canvas.addEventListener('touchstart',down,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',up,{passive:false});
    canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointermove',move); canvas.addEventListener('pointerup',up);
  }

  // Compatibilidad: si los botones viejos llaman estas funciones, redirigen al panel limpio.
  window.xiaraV5OpenUserSignature=openFirma;
  window.xiaraOpenFirmaUsuarioPanel=openFirma;
  window.xiaraV5OpenSealManager=openSello;
  window.xiaraSubirSelloOficial=openSello;
  window.xiaraFirmaDiagnosticoK=function(){ return {version:VERSION, company:activeCompanyId(), user:userKey(), userName:userName(), firma:!!getFirma(), sello:!!getSello(), firmaLen:(getFirma()||'').length, selloLen:(getSello()||'').length}; };

  // PRL: asegurar que los documentos existentes puedan leer sello/firma desde los campos esperados.
  window.xiaraFirmaCleanGet=function(){ return {firma:getFirma(), sello:getSello(), store:store()}; };

  function install(){
    try{ renderPanel(false); }catch(e){ console.warn('XIARA firma clean install:',e); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install); else install();
  setTimeout(install,300); setTimeout(install,1000); setInterval(install,2500);
  log({diagnostico:'usa xiaraFirmaDiagnosticoK()'});
})();


(function(){
  'use strict';
  var VERSION = 'V5.5.1 FIRMA CORE CLEAN PATCH L';
  var CARD_ID = 'xiara_firma_clean_l_card';
  var OVERLAY_ID = 'xiara_firma_clean_l_overlay';
  var STYLE_ID = 'xiara_firma_clean_l_style';
  var PREFIX = 'xiara_v551_clean_l_';

  function q(s, r){ return (r||document).querySelector(s); }
  function qa(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function now(){ return new Date().toISOString(); }
  function getDb(){ window.db = window.db || {}; return window.db; }
  function getCompanyId(){ try { return String(window.activeCompany || (typeof window.company === 'function' && window.company() && (window.company().id || window.company().nombre)) || 'global'); } catch(e){ return 'global'; } }
  function getUser(){ try { return (typeof window.user === 'function' && window.user()) || {}; } catch(e){ return {}; } }
  function getUserKey(){ var u = getUser(); return String(u.email || u.username || u.nombre || u.id || 'administrador').toLowerCase().replace(/[^a-z0-9._-]+/g,'_'); }
  function getUserName(){ var u = getUser(); return String(u.nombre || u.username || u.email || 'Administrador'); }
  function store(){
    var db = getDb();
    db.xiaraFirmaSello = db.xiaraFirmaSello || {};
    db.xiaraFirmaSello.empresas = db.xiaraFirmaSello.empresas || {};
    var cid = getCompanyId();
    db.xiaraFirmaSello.empresas[cid] = db.xiaraFirmaSello.empresas[cid] || {};
    var st = db.xiaraFirmaSello.empresas[cid];
    st.userFirmas = st.userFirmas || {};
    return st;
  }
  function firma(){
    var st = store();
    var key = getUserKey();
    var uf = st.userFirmas && st.userFirmas[key];
    return (uf && uf.dataUrl) || st.firmaPersonalDataUrl || st.firmaEmpresaDataUrl || st.firmaDataUrl || getDb().xiaraFirmaSello.firmaDataUrl || '';
  }
  function sello(){
    var st = store();
    return st.selloOficialDataUrl || st.selloDataUrl || getDb().xiaraFirmaSello.selloOficialDataUrl || getDb().xiaraFirmaSello.selloDataUrl || '';
  }
  function saveApp(){
    try { if (typeof window.localSave === 'function') window.localSave(); }
    catch(e){ console.warn('XIARA firma L: localSave no pudo guardar', e); }
  }
  function persistFirma(data, name){
    if(!data || String(data).length < 100) return false;
    var st = store();
    var key = getUserKey();
    var rec = { dataUrl:data, name:name || 'firma.png', usuario:getUserName(), userKey:key, updatedAt:now() };
    st.userFirmas[key] = rec;
    st.firmaPersonalDataUrl = data;
    st.firmaEmpresaDataUrl = data;
    st.firmaEmpresaUsuario = getUserName();
    st.firmaEmpresaUpdatedAt = rec.updatedAt;
    var db = getDb();
    db.xiaraFirmaSello.firmaDataUrl = data;
    db.xiaraFirmaSello.firmaEmpresaDataUrl = data;
    try { localStorage.setItem(PREFIX + 'firma_' + getCompanyId() + '_' + key, JSON.stringify(rec)); } catch(e){}
    saveApp();
    return true;
  }
  function persistSello(data, name){
    if(!data || String(data).length < 100) return false;
    var st = store();
    st.selloOficialDataUrl = data;
    st.selloDataUrl = data;
    st.selloOficialFileName = name || 'sello.png';
    st.selloUpdatedAt = now();
    var db = getDb();
    db.xiaraFirmaSello.selloDataUrl = data;
    db.xiaraFirmaSello.selloOficialDataUrl = data;
    try { localStorage.setItem(PREFIX + 'sello_' + getCompanyId(), JSON.stringify({dataUrl:data, name:name || 'sello.png', updatedAt:now()})); } catch(e){}
    saveApp();
    return true;
  }
  function restoreLight(){
    try { var f = JSON.parse(localStorage.getItem(PREFIX + 'firma_' + getCompanyId() + '_' + getUserKey()) || 'null'); if(f && f.dataUrl && !firma()) persistFirma(f.dataUrl, f.name); } catch(e){}
    try { var s = JSON.parse(localStorage.getItem(PREFIX + 'sello_' + getCompanyId()) || 'null'); if(s && s.dataUrl && !sello()) persistSello(s.dataUrl, s.name); } catch(e){}
  }
  function addStyle(){
    if(q('#'+STYLE_ID)) return;
    var st = document.createElement('style'); st.id = STYLE_ID;
    st.textContent = '.xiara-clean-l-card{margin-top:16px;border:1px solid #c7d2fe;background:#eef2ff}.xiara-clean-l-actions{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.xiara-clean-l-preview{margin-top:8px;min-height:110px;display:flex;align-items:center;justify-content:flex-start}.xiara-clean-l-img{max-width:260px;max-height:120px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;padding:8px;object-fit:contain}.xiara-clean-l-overlay{position:fixed;inset:0;background:rgba(15,23,42,.72);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px}.xiara-clean-l-box{width:min(980px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.35);color:#0f172a}.xiara-clean-l-close{float:right;border:0;background:#ef4444;color:#fff;border-radius:12px;padding:8px 12px;font-weight:900}.xiara-clean-l-pad{width:100%;height:280px;border:2px solid #94a3b8;border-radius:16px;background:#fff;touch-action:none;display:block}';
    document.head.appendChild(st);
  }
  function previewHtml(src){ return src ? '<img class="xiara-clean-l-img" src="'+src+'">' : '<span class="muted">Sin registrar.</span>'; }
  function renderPanel(){
    var el = q('#firmaDigital');
    if(!el) return;
    addStyle();
    restoreLight();
    qa('#xiara_v5_firma_sello_card,#xiara_firma_sello_fix_card,#xiara_firma_core_clean_card_k,#xiara_firma_clean_l_card').forEach(function(x){ try{x.remove();}catch(e){} });
    var div = document.createElement('div');
    div.className = 'card xiara-clean-l-card';
    div.id = CARD_ID;
    div.innerHTML = '<h3>🔐 Firma y sello oficial XIARA V5.5.1 CLEAN L</h3>'+
      '<p class="muted">Panel limpio. La firma queda asociada al usuario conectado y el sello a la empresa activa.</p>'+
      '<div class="xiara-clean-l-actions"><button type="button" id="xiara_l_btn_firma">✍️ Cargar / cambiar firma</button><button type="button" id="xiara_l_btn_sello" class="secondary">🏛️ Cargar / cambiar sello</button><button type="button" id="xiara_l_btn_refresh" class="secondary">Actualizar vista</button></div>'+
      '<div class="grid two"><div><b>Firma de '+esc(getUserName())+'</b><div class="xiara-clean-l-preview">'+previewHtml(firma())+'</div></div><div><b>Sello empresa</b><div class="xiara-clean-l-preview">'+previewHtml(sello())+'</div></div></div>';
    var seguimiento = Array.prototype.find.call(el.children, function(x){ return /Seguimiento de firmas/i.test(x.textContent || ''); });
    if(seguimiento) el.insertBefore(div, seguimiento); else el.appendChild(div);
    q('#xiara_l_btn_firma').onclick = openFirma;
    q('#xiara_l_btn_sello').onclick = openSello;
    q('#xiara_l_btn_refresh').onclick = renderPanel;
  }
  function closeOverlay(){ var o=q('#'+OVERLAY_ID); if(o) o.remove(); }
  function makeOverlay(title){
    closeOverlay(); addStyle();
    var ov = document.createElement('div'); ov.id = OVERLAY_ID; ov.className='xiara-clean-l-overlay';
    var box = document.createElement('div'); box.className='xiara-clean-l-box';
    var close = document.createElement('button'); close.type='button'; close.className='xiara-clean-l-close'; close.textContent='X'; close.onclick=closeOverlay;
    var h2 = document.createElement('h2'); h2.textContent = title;
    box.appendChild(close); box.appendChild(h2); ov.appendChild(box); document.body.appendChild(ov);
    return box;
  }
  function initPad(canvas){
    var ctx = canvas.getContext('2d'); var drawing=false; var last=null; canvas.__xiaraInk=false;
    ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#0f172a';
    function pos(ev){ var e=(ev.touches && ev.touches[0]) ? ev.touches[0] : ev; var r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*(canvas.width/r.width), y:(e.clientY-r.top)*(canvas.height/r.height)}; }
    function down(ev){ if(ev) ev.preventDefault(); drawing=true; last=pos(ev); canvas.__xiaraInk=true; }
    function move(ev){ if(!drawing) return; if(ev) ev.preventDefault(); var p=pos(ev); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; canvas.__xiaraInk=true; }
    function up(ev){ if(ev && ev.preventDefault) ev.preventDefault(); drawing=false; last=null; }
    canvas.onpointerdown=down; canvas.onpointermove=move; canvas.onpointerup=up; canvas.onpointercancel=up; canvas.onpointerleave=up;
    canvas.ontouchstart=down; canvas.ontouchmove=move; canvas.ontouchend=up;
    canvas.onmousedown=down; window.addEventListener('mousemove', move, {passive:false}); window.addEventListener('mouseup', up, {passive:false});
  }
  function readFile(file, cb){ var fr=new FileReader(); fr.onload=function(){ cb(fr.result); }; fr.readAsDataURL(file); }
  function openFirma(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    var box = makeOverlay('Firma personal');
    var p = document.createElement('p'); p.textContent='Dibuja la firma con mouse/dedo/lápiz óptico o sube una imagen JPG/PNG.'; box.appendChild(p);
    var canvas = document.createElement('canvas'); canvas.id='xiara_l_firma_pad'; canvas.width=900; canvas.height=280; canvas.className='xiara-clean-l-pad'; box.appendChild(canvas); initPad(canvas);
    var actions = document.createElement('div'); actions.className='xiara-clean-l-actions';
    actions.innerHTML = '<button type="button" id="xiara_l_clear_firma" class="secondary">Limpiar</button><button type="button" id="xiara_l_save_firma">Guardar firma dibujada</button><input id="xiara_l_firma_file" type="file" accept="image/*"><button type="button" id="xiara_l_save_firma_file" class="secondary">Guardar imagen subida</button>';
    box.appendChild(actions);
    q('#xiara_l_clear_firma').onclick=function(){ var c=q('#xiara_l_firma_pad'); c.getContext('2d').clearRect(0,0,c.width,c.height); c.__xiaraInk=false; };
    q('#xiara_l_save_firma').onclick=function(){ var c=q('#xiara_l_firma_pad'); if(!c.__xiaraInk) return alert('Dibuje la firma antes de guardar.'); persistFirma(c.toDataURL('image/png'),'firma_dibujada.png'); closeOverlay(); renderPanel(); alert('Firma guardada y visible en el panel.'); };
    q('#xiara_l_save_firma_file').onclick=function(){ var file=q('#xiara_l_firma_file').files[0]; if(!file) return alert('Selecciona una imagen de firma.'); readFile(file,function(data){ persistFirma(data,file.name); closeOverlay(); renderPanel(); alert('Firma subida y visible en el panel.'); }); };
  }
  function openSello(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    var box = makeOverlay('Sello oficial de empresa');
    var p = document.createElement('p'); p.textContent='Sube el sello oficial en JPG o PNG.'; box.appendChild(p);
    var input = document.createElement('input'); input.id='xiara_l_sello_file'; input.type='file'; input.accept='image/*'; box.appendChild(input);
    var actions = document.createElement('div'); actions.className='xiara-clean-l-actions'; actions.innerHTML='<button type="button" id="xiara_l_save_sello">Guardar sello oficial</button>'; box.appendChild(actions);
    q('#xiara_l_save_sello').onclick=function(){ var file=q('#xiara_l_sello_file').files[0]; if(!file) return alert('Selecciona una imagen de sello.'); readFile(file,function(data){ persistSello(data,file.name); closeOverlay(); renderPanel(); alert('Sello guardado y visible en el panel.'); }); };
  }

  window.xiaraV5OpenUserSignature = openFirma;
  window.xiaraOpenFirmaUsuarioPanel = openFirma;
  window.xiaraV5OpenSealManager = openSello;
  window.xiaraSubirSelloOficial = openSello;
  window.xiaraFirmaDiagnosticoL = function(){ return {version:VERSION, company:getCompanyId(), user:getUserKey(), userName:getUserName(), firma:!!firma(), sello:!!sello(), firmaLen:(firma()||'').length, selloLen:(sello()||'').length}; };
  window.xiaraFirmaCleanGet = function(){ return {firma:firma(), sello:sello(), store:store()}; };

  var oldRenderFirma = window.renderFirmaDigitalPro;
  if(typeof oldRenderFirma === 'function'){
    window.renderFirmaDigitalPro = function(){ var r = oldRenderFirma.apply(this, arguments); try{ renderPanel(); }catch(e){ console.warn('render firma L', e); } return r; };
  }
  function install(){ try{ renderPanel(); }catch(e){ console.warn('install firma L', e); } }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  setTimeout(install, 300); setTimeout(install, 1000); setInterval(install, 2500);
  console.log('✓ XIARA '+VERSION+' cargado', {diagnostico:'xiaraFirmaDiagnosticoL()'});
})();


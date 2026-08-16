/* XIARA V7 — Unified release validation */
(function(){
'use strict';
const V7 = window.XIARA_V7;
if(!V7) throw new Error('XIARA_V7 no disponible');

async function check(name, fn){
  try{
    const result=await fn();
    return [name,!!result,null];
  }catch(e){
    return [name,false,e?.message||String(e)];
  }
}

window.xiaraV7ValidateAll=async function(){
  const checks=[];

  checks.push(await check('V7 core',async()=>!!window.XIARA_V7?.modules?.core));
  checks.push(await check('V7 runtime',async()=>!!window.XIARA_V7?.modules?.runtime));
  checks.push(await check('Context API',async()=>!!window.XIARA_CONTEXT_API));
  checks.push(await check('Modelo db',async()=>!!window.XIARA_V7?.getDB?.()));
  checks.push(await check('Login disponible',async()=>typeof window.login==='function'));

  checks.push(await check('Firestore',async()=>{
    const r=await window.XIARA?.dbService?.healthCheck?.();
    return !!r?.ok;
  }));

  checks.push(await check('Storage',async()=>{
    const r=await window.XIARA?.storageService?.healthCheck?.();
    return !!r?.ok;
  }));

  checks.push(await check('Storage bloqueado por defecto',async()=>
    window.XIARA?.storageService?.enabled===false
  ));

  checks.push(await check('Documentos V6/V7',async()=>{
    const r=await window.XIARA?.documents?.healthCheck?.();
    return !!r?.ok;
  }));

  checks.push(await check('Validación V6.2 heredada',async()=>{
    const r=await window.xiaraV62ValidateAll?.();
    return !!r?.ok;
  }));

  checks.push(await check('Smoke test heredado',async()=>{
    const r=await window.xiaraV62SmokeTest?.();
    return !!r?.ok;
  }));

  const runtime=window.xiaraV7RuntimeSnapshot?.()||{};
  checks.push(['Errores V7 = 0',(runtime.errors||0)===0,String(runtime.errors||0)]);
  checks.push(['Rechazos V7 = 0',(runtime.rejections||0)===0,String(runtime.rejections||0)]);
  checks.push(['Fallos operación = 0',(runtime.operationFailures||0)===0,String(runtime.operationFailures||0)]);

  const ok=checks.every(x=>x[1]);
  const failed=checks.filter(x=>!x[1]);

  const result={
    ok,
    version:V7.version,
    checkedAt:new Date().toISOString(),
    checks,
    failed,
    runtime,
    flags:{...V7.flags}
  };

  window.XIARA_V7_RELEASE_STATUS=result;

  try{
    localStorage.setItem('XIARA_V7_LAST_CHECK',JSON.stringify({
      ok,
      version:V7.version,
      checkedAt:result.checkedAt
    }));
  }catch(_e){}

  alert(
    (ok?'XIARA V7 FAST-TRACK APROBADA':'XIARA V7 REQUIERE REVISIÓN')+
    '\n\n'+checks.map(([n,v])=>(v?'OK  ':'FALLO  ')+n).join('\n')+
    '\n\nModo seguro: '+(V7.flags.safeMode?'ACTIVO':'INACTIVO')+
    '\nMigración destructiva: '+(V7.flags.destructiveMigration?'ACTIVA':'BLOQUEADA')+
    (failed.length?'\n\nFallos:\n'+failed.map(x=>'• '+x[0]+(x[2]?' — '+x[2]:'')).join('\n'):'')
  );

  return result;
};

window.xiaraV7ExecutiveReport=function(){
  const r=window.XIARA_V7_RELEASE_STATUS;
  if(!r){
    alert('Ejecuta primero VALIDAR V7 TODO.');
    return null;
  }

  const text=[
    'XIARA IA AUDITORÍA — V7 ENTERPRISE',
    'Versión: '+r.version,
    'Estado: '+(r.ok?'APROBADA':'REVISAR'),
    'Fecha: '+r.checkedAt,
    'Modo seguro: '+(r.flags.safeMode?'Sí':'No'),
    'Compatibilidad legacy: '+(r.flags.legacyCompatibility?'Sí':'No'),
    'Errores runtime V7: '+(r.runtime.errors||0),
    'Promesas rechazadas V7: '+(r.runtime.rejections||0),
    'Fallos operación: '+(r.runtime.operationFailures||0),
    'Listeners activos: '+(r.runtime.activeListeners||0)
  ].join('\n');

  window.XIARA_V7_EXECUTIVE_REPORT=text;
  navigator.clipboard?.writeText?.(text).catch(()=>{});
  alert(text);
  return text;
};

V7.register('release',{
  validate:window.xiaraV7ValidateAll,
  report:window.xiaraV7ExecutiveReport
});

})();

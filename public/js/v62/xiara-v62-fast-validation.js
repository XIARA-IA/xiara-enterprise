/* XIARA V6.2 — Fast validation
   Sustituye varias comprobaciones manuales por un único control.
   No modifica datos ni lógica de negocio.
*/
(function(){
'use strict';

window.XIARA_V62_MODULES = window.XIARA_V62_MODULES || {};
window.XIARA_V62_MODULES.fastValidation = {
  version:'6.2.0',
  status:'loaded',
  loadedAt:new Date().toISOString()
};

async function safeCheck(name, fn){
  try{
    const value=await fn();
    return [name, !!value, null];
  }catch(e){
    return [name, false, e?.message||String(e)];
  }
}

window.xiaraV62ValidateAll = async function(){
  const checks=[];

  checks.push(await safeCheck('Context API', async()=>!!window.XIARA_CONTEXT_API));
  checks.push(await safeCheck('Arquitectura V6.2', async()=>{
    const a=window.XIARA_V62_MODULES?.architecture?.snapshot?.();
    return !!a?.ok;
  }));
  checks.push(await safeCheck('Gate modular', async()=>{
    const a=window.XIARA_V62_MODULES?.architecture?.snapshot?.();
    return !!a?.ok &&
      (a.runtimeErrors||0)===0 &&
      (a.rejectedPromises||0)===0 &&
      (a.operationFailures||0)===0;
  }));
  checks.push(await safeCheck('Firestore', async()=>{
    const r=await window.XIARA?.dbService?.healthCheck?.();
    return !!r?.ok;
  }));
  checks.push(await safeCheck('Storage', async()=>{
    const r=await window.XIARA?.storageService?.healthCheck?.();
    return !!r?.ok;
  }));
  checks.push(await safeCheck('Storage seguro por defecto', async()=>
    window.XIARA?.storageService?.enabled===false
  ));
  checks.push(await safeCheck('Documentos V6', async()=>{
    const r=await window.XIARA?.documents?.healthCheck?.();
    return !!r?.ok;
  }));
  checks.push(await safeCheck('Login disponible', async()=>typeof window.login==='function'));
  checks.push(await safeCheck('Integridad documental disponible', async()=>
    typeof window.xiaraDocumentIntegrityScan==='function'
  ));
  checks.push(await safeCheck('Inventario modular', async()=>
    !!window.XIARA_V62_MODULES?.inventory?.buildInventory?.().ok
  ));

  const errors=window.XIARA_DIAG?.errors?.length||0;
  const rejected=window.XIARA_DIAG?.rejections?.length||0;
  const failures=window.XIARA_OPS?.failures?.length||0;

  checks.push(['Errores runtime = 0',errors===0,errors?String(errors):null]);
  checks.push(['Promesas rechazadas = 0',rejected===0,rejected?String(rejected):null]);
  checks.push(['Fallos operación = 0',failures===0,failures?String(failures):null]);

  const ok=checks.every(x=>x[1]);
  const failed=checks.filter(x=>!x[1]);

  window.XIARA_V62_FULL_VALIDATION={
    ok,
    checkedAt:new Date().toISOString(),
    checks,
    failed
  };

  alert(
    (ok?'VALIDACIÓN INTEGRAL V6.2 APROBADA':'VALIDACIÓN INTEGRAL V6.2 REQUIERE REVISIÓN')+
    '\n\n'+checks.map(([n,v])=>(v?'OK  ':'FALLO  ')+n).join('\n')+
    (failed.length?'\n\nFallos:\n'+failed.map(x=>'• '+x[0]+(x[2]?' — '+x[2]:'')).join('\n'):'')+
    '\n\nA partir de este punto no es necesario ejecutar los diagnósticos uno por uno.'
  );

  return window.XIARA_V62_FULL_VALIDATION;
};

})();

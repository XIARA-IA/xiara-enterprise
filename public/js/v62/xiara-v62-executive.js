/* XIARA V6.2 — Executive release readiness
   Fast-track para preparación de demo/presentación.
   No modifica datos de negocio.
*/
(function(){
'use strict';

window.XIARA_V62_MODULES = window.XIARA_V62_MODULES || {};

const RELEASE = {
  version:'6.2.0-enterprise-rc-fast2',
  status:'release-candidate',
  loadedAt:new Date().toISOString()
};

function environment(){
  const host=location.hostname;
  return {
    host,
    local: host==='localhost' || host==='127.0.0.1',
    production: host==='xiara-ia-auditoria.web.app',
    href:location.href
  };
}

function runtimeSnapshot(){
  const perf=window.XIARA_V62_PERF||{};
  const diag=window.XIARA_DIAG||{};
  const ops=window.XIARA_OPS||{};
  return {
    errors:diag.errors?.length||0,
    rejections:diag.rejections?.length||0,
    operationFailures:ops.failures?.length||0,
    renders:perf.renders||0,
    collapsedRenders:perf.collapsed||0,
    maxRenderMs:Math.round((perf.maxMs||0)*10)/10,
    activeListeners:window.XIARA_PERF?.activeSnapshotListeners||0
  };
}

function moduleSnapshot(){
  const mods=window.XIARA_V62_MODULES||{};
  return {
    context:mods.context?.status==='loaded',
    architecture:mods.architecture?.status==='loaded',
    inventory:mods.inventory?.status==='loaded',
    observability:mods.observability?.status==='loaded',
    fastValidation:mods.fastValidation?.status==='loaded',
    executive:true
  };
}

window.XIARA_V62_MODULES.executive={
  ...RELEASE,
  environment,
  runtimeSnapshot,
  moduleSnapshot
};

/* 1. Identificación de entorno */
window.xiaraV62EnvironmentStatus=function(){
  return environment();
};

/* 2. Snapshot de runtime */
window.xiaraV62ExecutiveRuntime=function(){
  return runtimeSnapshot();
};

/* 3. Snapshot de módulos */
window.xiaraV62ExecutiveModules=function(){
  return moduleSnapshot();
};

/* 4. Smoke test no destructivo */
window.xiaraV62SmokeTest=async function(){
  const checks=[];
  const push=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});
  try{push('Login',typeof window.login==='function');}catch(e){push('Login',false,e.message);}
  try{push('Context API',!!window.XIARA_CONTEXT_API);}catch(e){push('Context API',false,e.message);}
  try{push('Firestore service',!!window.XIARA?.dbService);}catch(e){push('Firestore service',false,e.message);}
  try{push('Storage service',!!window.XIARA?.storageService);}catch(e){push('Storage service',false,e.message);}
  try{push('Documents service',!!window.XIARA?.documents);}catch(e){push('Documents service',false,e.message);}
  try{push('Render principal',typeof window.XIARA_CONTEXT_API?.renderAll==='function');}catch(e){push('Render principal',false,e.message);}
  try{push('Integridad documental',typeof window.xiaraDocumentIntegrityScan==='function' || !!window.XIARA_V62_MODULES?.inventory);}catch(e){push('Integridad documental',false,e.message);}
  return {ok:checks.every(x=>x.ok),checks};
};

/* 5. Validación integral + 6. smoke test + 7. snapshot de entorno */
window.xiaraV62PreparePresentation=async function(){
  const validation=await window.xiaraV62ValidateAll();
  const smoke=await window.xiaraV62SmokeTest();
  const env=environment();
  const runtime=runtimeSnapshot();
  const modules=moduleSnapshot();

  const ok=!!validation?.ok && !!smoke?.ok &&
    runtime.errors===0 &&
    runtime.rejections===0 &&
    runtime.operationFailures===0;

  const result={
    ok,
    version:RELEASE.version,
    checkedAt:new Date().toISOString(),
    environment:env,
    runtime,
    modules,
    validation,
    smoke
  };

  /* 8. Guardar último estado de release solo como estado ligero */
  try{
    localStorage.setItem('XIARA_V62_LAST_RELEASE_CHECK',JSON.stringify({
      ok:result.ok,
      version:result.version,
      checkedAt:result.checkedAt,
      environment:result.environment.host
    }));
  }catch(_e){}

  window.XIARA_V62_EXECUTIVE_STATUS=result;

  /* 9. Mensaje único de readiness */
  alert(
    (ok?'XIARA V6.2 LISTA PARA PRESENTACIÓN':'XIARA V6.2 REQUIERE REVISIÓN')+
    '\n\nVersión: '+result.version+
    '\nEntorno: '+(env.local?'LOCAL':env.production?'PRODUCCIÓN':env.host)+
    '\nValidación integral: '+(validation?.ok?'OK':'FALLO')+
    '\nSmoke test: '+(smoke?.ok?'OK':'FALLO')+
    '\nErrores runtime: '+runtime.errors+
    '\nPromesas rechazadas: '+runtime.rejections+
    '\nFallos de operación: '+runtime.operationFailures+
    '\nMódulos core V6.2: '+Object.values(modules).filter(Boolean).length+'/'+Object.keys(modules).length+
    '\n\nSi todo figura OK, puedes usar esta build como release candidate para la demo.'
  );

  return result;
};

/* 10. Informe ejecutivo copiable desde consola/UI */
window.xiaraV62ExecutiveReport=function(){
  const r=window.XIARA_V62_EXECUTIVE_STATUS;
  if(!r){
    alert('Ejecuta primero "PREPARAR PRESENTACIÓN V6.2".');
    return null;
  }

  const lines=[
    'XIARA IA AUDITORÍA — INFORME EJECUTIVO V6.2',
    'Versión: '+r.version,
    'Fecha: '+r.checkedAt,
    'Entorno: '+r.environment.host,
    'Estado: '+(r.ok?'APROBADA':'REVISAR'),
    'Errores runtime: '+r.runtime.errors,
    'Promesas rechazadas: '+r.runtime.rejections,
    'Fallos de operación: '+r.runtime.operationFailures,
    'Renders: '+r.runtime.renders,
    'Renders redundantes colapsados: '+r.runtime.collapsedRenders,
    'Listeners activos: '+r.runtime.activeListeners
  ];

  const report=lines.join('\n');
  window.XIARA_V62_EXECUTIVE_REPORT=report;

  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(report).catch(()=>{});
  }

  alert(report+'\n\nEl informe también queda disponible en XIARA_V62_EXECUTIVE_REPORT.');
  return report;
};

})();

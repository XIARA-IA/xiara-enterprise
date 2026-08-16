/* XIARA V6.2 — Observabilidad y preflight
   Extraído del monolito de forma conservadora.
   No contiene lógica de negocio ni modifica Firestore/Storage.
*/
(function(){
'use strict';

window.XIARA_V62_MODULES=window.XIARA_V62_MODULES||{};
window.XIARA_V62_MODULES.stage2Fix={version:'6.2.0',status:'safe-boundary-restored',loadedAt:new Date().toISOString()};
window.XIARA_V62_MODULES.observability={
  version:'6.2.0',
  loadedAt:new Date().toISOString(),
  status:'loaded'
};

try{
  if('PerformanceObserver' in window && !window.__XIARA_V62_LONGTASK_OBSERVER){
    const obs=new PerformanceObserver(list=>{
      const p=window.XIARA_V62_PERF;
      if(!p) return;
      list.getEntries().forEach(e=>p.longTasks.push({
        duration:Math.round(e.duration),
        start:Math.round(e.startTime)
      }));
      if(p.longTasks.length>25) p.longTasks.splice(0,p.longTasks.length-25);
    });
    obs.observe({entryTypes:['longtask']});
    window.__XIARA_V62_LONGTASK_OBSERVER=obs;
  }
}catch(_e){}

window.xiaraV62RuntimeDuplicateIds=function(){
 const seen=new Map(), dup=[];
 document.querySelectorAll('[id]').forEach(el=>{
   const id=el.id;
   if(!id) return;
   if(seen.has(id)) dup.push(id); else seen.set(id,el);
 });
 return [...new Set(dup)];
};

window.xiaraV62FastTrackAudit=function(){
 const p=window.XIARA_V62_PERF||{};
 const duplicateIds=xiaraV62RuntimeDuplicateIds();
 const diag=window.XIARA_DIAG||{errors:[],rejections:[]};
 const ops=window.XIARA_OPS||{locks:new Map(),failures:[]};
 const avg=p.renders?Math.round((p.totalMs/p.renders)*10)/10:0;
 const staticDup=p.staticDuplicateFunctions||[];
 const activeListeners=window.XIARA_PERF?.activeSnapshotListeners||0;

 const result={
   ok:duplicateIds.length===0 && (diag.errors||[]).length===0 && (diag.rejections||[]).length===0,
   version:p.version||'6.2.0-enterprise-dev',
   renders:p.renders||0,
   collapsed:p.collapsed||0,
   averageMs:avg,
   maxMs:Math.round((p.maxMs||0)*10)/10,
   duplicateDomIds:duplicateIds,
   staticDuplicateFunctionNames:staticDup,
   runtimeErrors:(diag.errors||[]).length,
   rejectedPromises:(diag.rejections||[]).length,
   operationFailures:(ops.failures||[]).length,
   activeListeners,
   longTasks:(p.longTasks||[]).length
 };
 window.XIARA_V62_AUDIT=result;

 alert(
   (result.ok?'V6.2 FAST-TRACK OK':'V6.2 REVISAR')+'\n\n'+
   'Renders ejecutados: '+result.renders+'\n'+
   'Renders redundantes colapsados: '+result.collapsed+'\n'+
   'Media render: '+result.averageMs+' ms\n'+
   'Máximo render: '+result.maxMs+' ms\n'+
   'IDs DOM duplicados activos: '+duplicateIds.length+'\n'+
   'Errores runtime: '+result.runtimeErrors+'\n'+
   'Promesas rechazadas: '+result.rejectedPromises+'\n'+
   'Fallos de operación: '+result.operationFailures+'\n'+
   'Listeners activos: '+result.activeListeners+'\n'+
   'Long tasks observadas: '+result.longTasks+'\n\n'+
   'Duplicidades de funciones detectadas estáticamente: '+staticDup.length+' nombres.\n'+
   'No se ha eliminado ninguna automáticamente porque varias pertenecen a ámbitos/IIFE distintos.'
 );
 return result;
};

window.xiaraV62Preflight=async function(){
 const checks=[];
 try{const x=await window.XIARA.dbService.healthCheck();checks.push(['Firestore',!!x.ok]);}catch(_e){checks.push(['Firestore',false]);}
 try{const x=await window.XIARA.storageService.healthCheck();checks.push(['Storage',!!x.ok]);checks.push(['Storage bloqueado por defecto',window.XIARA.storageService.enabled===false]);}catch(_e){checks.push(['Storage',false]);}
 try{const x=await window.XIARA.documents.healthCheck();checks.push(['Documentos V6',!!x.ok]);}catch(_e){checks.push(['Documentos V6',false]);}
 const a=xiaraV62FastTrackAudit();
 checks.push(['Runtime V6.2',!!a.ok]);
 const ok=checks.every(x=>x[1]);
 window.XIARA_V62_PREFLIGHT={ok,checkedAt:new Date().toISOString(),checks,audit:a};
 alert((ok?'PREFLIGHT V6.2 APROBADO':'PREFLIGHT V6.2 REQUIERE REVISIÓN')+'\n\n'+checks.map(x=>(x[1]?'OK  ':'FALLO  ')+x[0]).join('\n'));
 return window.XIARA_V62_PREFLIGHT;
};

window.xiaraV62ModuleStatus=function(){
  const mods=window.XIARA_V62_MODULES||{};
  const obs=mods.observability;
  const ok=!!(
    obs?.status==='loaded' &&
    typeof window.xiaraV62FastTrackAudit==='function' &&
    typeof window.xiaraV62Preflight==='function'
  );
  const result={
    ok,
    observability:obs||null,
    version:window.XIARA_V62_PERF?.version||'6.2'
  };
  alert(
    (ok?'MÓDULOS V6.2 OK':'MÓDULOS V6.2 REVISAR')+
    '\n\nObservabilidad: '+(obs?.status||'no cargada')+
    '\nAuditoría: '+(typeof window.xiaraV62FastTrackAudit==='function'?'OK':'FALLO')+
    '\nPreflight: '+(typeof window.xiaraV62Preflight==='function'?'OK':'FALLO')+
    '\nLímite modular seguro: '+(window.XIARA_V62_MODULES?.stage2Fix?.status==='safe-boundary-restored'?'OK':'FALLO')
  );
  return result;
};

})();

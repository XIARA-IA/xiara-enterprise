/* XIARA V7 — Enterprise hardening bundle
   10 procesos agrupados, todos no destructivos.
*/
(function(){
'use strict';

const V7=window.XIARA_V7;
if(!V7) throw new Error('XIARA_V7 no disponible');

const E={
  version:'7.0.0-enterprise-rc2',
  loadedAt:new Date().toISOString(),
  status:'loaded'
};

/* 1. Registro de capacidades */
E.capabilities=function(){
  return {
    firestore:!!window.XIARA?.dbService,
    storage:!!window.XIARA?.storageService,
    documents:!!window.XIARA?.documents,
    context:!!window.XIARA_CONTEXT_API,
    legacyCompatibility:V7.flags?.legacyCompatibility!==false,
    safeMode:V7.flags?.safeMode!==false,
    destructiveMigration:V7.flags?.destructiveMigration===true
  };
};

/* 2. Readiness multiempresa */
E.multiCompany=function(){
  const db=V7.getDB?.();
  let companies=0;
  try{
    companies=Array.isArray(db?.empresas)?db.empresas.length:0;
  }catch(_e){}
  return {
    ready:!!window.XIARA_CONTEXT_API,
    companies,
    activeCompany:window.XIARA_CONTEXT_API?.getCompanyId?.()||null
  };
};

/* 3. Estado documental */
E.documents=function(){
  const db=V7.getDB?.();
  let rrhh=0, legal=0, finance=0;
  try{
    (db?.rrhh||[]).forEach(emp=>{
      Object.values(emp?.carpetas||{}).forEach(arr=>{ if(Array.isArray(arr)) rrhh+=arr.length; });
    });
    (db?.casosJudiciales||[]).forEach(c=>{
      Object.values(c?.carpetas||{}).forEach(arr=>{ if(Array.isArray(arr)) legal+=arr.length; });
    });
    (db?.facturas||[]).forEach(f=>{
      const arr=f?.documentos||f?.docs||[];
      if(Array.isArray(arr)) finance+=arr.length;
    });
  }catch(_e){}
  return {rrhh,legal,finance,total:rrhh+legal+finance};
};


/* 3B. Inventario persistente Firestore V6/V7 */
E.persistentDocuments=async function(){
  const result={
    ok:false,
    count:0,
    active:0,
    withStoragePath:0,
    withDownloadUrl:0,
    companyId:null,
    source:null,
    reason:null
  };

  try{
    const api=window.XIARA_CONTEXT_API;
    let companyId=null;

    try{ companyId=api?.getCompanyId?.()||null; }catch(_e){}

    // Fallbacks conservadores para empresa activa.
    if(!companyId){
      try{
        const db=V7.getDB?.();
        companyId=
          db?.empresaActivaId ||
          db?.activeCompany ||
          db?.empresa_id ||
          db?.empresaId ||
          null;
      }catch(_e){}
    }

    // Si sigue sin resolverse y solo existe una empresa, usarla.
    if(!companyId){
      try{
        const db=V7.getDB?.();
        const empresas=Array.isArray(db?.empresas)?db.empresas:[];
        if(empresas.length===1){
          companyId=empresas[0]?.id || empresas[0]?.empresaId || empresas[0]?.empresa_id || null;
        }
      }catch(_e){}
    }

    result.companyId=companyId;

    const service=window.XIARA?.dbService;
    if(!service?.list){
      result.reason='Servicio Firestore V6 no disponible';
      return result;
    }

    let rows=[];

    // Estrategia 1: consulta multiempresa estándar por empresa_id.
    if(companyId){
      try{
        rows=await service.list('documentos',{empresaId:companyId,limit:5000});
        if(Array.isArray(rows)){
          result.source='empresaId';
        }
      }catch(_e){
        rows=[];
      }
    }

    // Estrategia 2: fallback controlado sin filtro; luego filtrar en memoria.
    if(!Array.isArray(rows) || rows.length===0){
      try{
        const all=await service.list('documentos',{limit:5000});
        if(Array.isArray(all)){
          rows=companyId
            ? all.filter(d=>
                d?.empresa_id===companyId ||
                d?.empresaId===companyId ||
                d?.companyId===companyId
              )
            : all;
          result.source=companyId?'fallback-memory-filter':'fallback-unfiltered';
        }
      }catch(e){
        result.reason=e?.message||String(e);
        rows=[];
      }
    }

    rows=Array.isArray(rows)?rows:[];

    result.ok=true;
    result.count=rows.length;
    result.active=rows.filter(d=>d?.estado!=='eliminado').length;
    result.withStoragePath=rows.filter(d=>!!d?.storagePath).length;
    result.withDownloadUrl=rows.filter(d=>!!d?.downloadUrl).length;

    return result;
  }catch(e){
    result.reason=e?.message||String(e);
    return result;
  }
};


/* 4. Estado legacy */
E.legacy=function(){
  const db=V7.getDB?.();
  let dead=0,persistent=0;
  try{
    (db?.rrhh||[]).forEach(emp=>{
      Object.values(emp?.carpetas||{}).forEach(arr=>{
        (Array.isArray(arr)?arr:[]).forEach(d=>{
          if(d?.legacyUnavailable || d?.estadoArchivo==='Legacy no recuperable') dead++;
          if(d?.v6DocumentId || d?.downloadUrl || d?.storagePath) persistent++;
        });
      });
    });
  }catch(_e){}
  return {dead,persistent};
};

/* 5. Snapshot de rendimiento */
E.performance=function(){
  const p=window.XIARA_V62_PERF||{};
  return {
    renders:p.renders||0,
    collapsed:p.collapsed||0,
    avgMs:p.renders?Math.round((p.totalMs/p.renders)*10)/10:0,
    maxMs:Math.round((p.maxMs||0)*10)/10,
    longTasks:window.XIARA_V7_RUNTIME?.longTasks?.length||0
  };
};

/* 6. Snapshot de listeners */
E.listeners=function(){
  return {
    active:window.XIARA_PERF?.activeSnapshotListeners||0
  };
};

/* 7. Matriz básica de seguridad */
E.security=function(){
  return {
    storageDisabledByDefault:window.XIARA?.storageService?.enabled===false,
    destructiveMigrationBlocked:V7.flags?.destructiveMigration!==true,
    legacyAutoDeleteBlocked:V7.flags?.autoDeleteLegacy!==true,
    safeMode:V7.flags?.safeMode===true
  };
};

/* 8. Readiness de presentación */
E.presentation=function(){
  const runtime=window.xiaraV7RuntimeSnapshot?.()||{};
  const security=E.security();
  return {
    ok:(runtime.errors||0)===0 &&
       (runtime.rejections||0)===0 &&
       (runtime.operationFailures||0)===0 &&
       security.storageDisabledByDefault &&
       security.destructiveMigrationBlocked &&
       security.legacyAutoDeleteBlocked
  };
};

/* 9. Consolidación de estado */

window.xiaraV7EnterpriseFinalSnapshot=async function(){
  const base=window.xiaraV7EnterpriseSnapshot();
  const persistent=await E.persistentDocuments();
  const result={
    ...base,
    persistentDocuments:persistent,
    documents:{
      ...base.documents,
      persistent:persistent.count||0,
      persistentActive:persistent.active||0
    }
  };
  window.XIARA_V7_ENTERPRISE_FINAL_STATUS=result;
  return result;
};


window.xiaraV7EnterpriseSnapshot=function(){
  const result={
    version:E.version,
    checkedAt:new Date().toISOString(),
    capabilities:E.capabilities(),
    multiCompany:E.multiCompany(),
    documents:E.documents(),
    legacy:E.legacy(),
    performance:E.performance(),
    listeners:E.listeners(),
    security:E.security(),
    presentation:E.presentation()
  };
  window.XIARA_V7_ENTERPRISE_STATUS=result;
  return result;
};

/* 10. Única validación enterprise */
window.xiaraV7EnterpriseValidate=async function(){
  const base=await window.xiaraV7ValidateAll();
  const e=window.xiaraV7EnterpriseSnapshot();

  const checks=[
    ['Base V7',!!base?.ok],
    ['Safe mode',e.security.safeMode],
    ['Storage seguro',e.security.storageDisabledByDefault],
    ['Migración destructiva bloqueada',e.security.destructiveMigrationBlocked],
    ['Auto-borrado legacy bloqueado',e.security.legacyAutoDeleteBlocked],
    ['Contexto multiempresa',e.multiCompany.ready],
    ['Presentación',e.presentation.ok]
  ];

  const ok=checks.every(x=>x[1]);
  window.XIARA_V7_ENTERPRISE_RELEASE={
    ok,
    checkedAt:new Date().toISOString(),
    checks,
    snapshot:e
  };

  alert(
    (ok?'XIARA V7 ENTERPRISE APROBADA':'XIARA V7 ENTERPRISE REVISAR')+
    '\n\n'+checks.map(([n,v])=>(v?'OK  ':'FALLO  ')+n).join('\n')+
    '\n\nDocumentos inventariados: '+e.documents.total+
    '\nLegacy no recuperable: '+e.legacy.dead+
    '\nDocumentos persistentes detectados: '+e.legacy.persistent+
    '\nListeners activos: '+e.listeners.active+
    '\nRender medio: '+e.performance.avgMs+' ms'
  );

  return window.XIARA_V7_ENTERPRISE_RELEASE;
};


window.xiaraV7CloseRelease=async function(){
  const base=await window.xiaraV7ValidateAll();
  const finalSnapshot=await window.xiaraV7EnterpriseFinalSnapshot();

  const p=finalSnapshot.persistentDocuments||{};
  const runtime=window.xiaraV7RuntimeSnapshot?.()||{};
  const checks=[
    ['Base V7',!!base?.ok],
    ['Safe mode',finalSnapshot.security?.safeMode===true],
    ['Storage seguro',finalSnapshot.security?.storageDisabledByDefault===true],
    ['Migración destructiva bloqueada',finalSnapshot.security?.destructiveMigrationBlocked===true],
    ['Auto-borrado legacy bloqueado',finalSnapshot.security?.legacyAutoDeleteBlocked===true],
    ['Contexto multiempresa',finalSnapshot.multiCompany?.ready===true],
    ['Firestore documentos consultable',p.ok===true],
    ['Errores runtime = 0',(runtime.errors||0)===0],
    ['Promesas rechazadas = 0',(runtime.rejections||0)===0],
    ['Fallos operación = 0',(runtime.operationFailures||0)===0]
  ];

  const ok=checks.every(x=>x[1]);
  const result={
    ok,
    version:'7.0.0-enterprise-rc2',
    checkedAt:new Date().toISOString(),
    checks,
    snapshot:finalSnapshot,
    runtime,
    releaseReady:ok
  };
  window.XIARA_V7_FINAL_RELEASE=result;

  try{
    localStorage.setItem('XIARA_V7_FINAL_RELEASE',JSON.stringify({
      ok,
      version:result.version,
      checkedAt:result.checkedAt,
      persistentDocuments:p.count||0,
      persistentActive:p.active||0
    }));
  }catch(_e){}

  const lines=[
    ok?'XIARA V7 LISTA PARA CIERRE':'XIARA V7 REQUIERE REVISIÓN',
    '',
    ...checks.map(([n,v])=>(v?'OK  ':'FALLO  ')+n),
    '',
    'Documentos inventariados legacy/local: '+(finalSnapshot.documents?.total||0),
    'Documentos persistentes Firestore: '+(p.count||0)+(p.source?' ['+p.source+']':''),
    'Documentos persistentes activos: '+(p.active||0),
    'Con storagePath: '+(p.withStoragePath||0),
    'Con downloadUrl: '+(p.withDownloadUrl||0),
    'Legacy no recuperable: '+(finalSnapshot.legacy?.dead||0),
    'Listeners activos: '+(finalSnapshot.listeners?.active||0),
    'Render medio: '+(finalSnapshot.performance?.avgMs||0)+' ms',
    '',
    ok?'Release candidate 7.0.0-enterprise-rc1 aprobada.':'No cerrar/taggear hasta corregir los fallos.'
  ];

  alert(lines.join('\n'));
  return result;
};

window.xiaraV7FinalReport=function(){
  const r=window.XIARA_V7_FINAL_RELEASE;
  if(!r){
    alert('Ejecuta primero CERRAR V7.');
    return null;
  }
  const p=r.snapshot?.persistentDocuments||{};
  const text=[
    'XIARA IA AUDITORÍA — V7 ENTERPRISE FINAL',
    'Versión: '+r.version,
    'Estado: '+(r.ok?'APROBADA':'REVISAR'),
    'Fecha: '+r.checkedAt,
    'Documentos persistentes: '+(p.count||0),
    'Persistentes activos: '+(p.active||0),
    'Legacy no recuperable: '+(r.snapshot?.legacy?.dead||0),
    'Errores runtime: '+(r.runtime?.errors||0),
    'Promesas rechazadas: '+(r.runtime?.rejections||0),
    'Fallos operación: '+(r.runtime?.operationFailures||0)
  ].join('\n');
  window.XIARA_V7_FINAL_REPORT=text;
  navigator.clipboard?.writeText?.(text).catch(()=>{});
  alert(text);
  return text;
};


V7.register('enterprise',E);

})();

/* XIARA V6.2 — Architecture contract
   Capa de validación segura. No mueve, borra ni reescribe lógica de negocio.
*/
(function(){
'use strict';

window.XIARA_V62_MODULES = window.XIARA_V62_MODULES || {};

const contract = {
  version: '6.2.0',
  loadedAt: new Date().toISOString(),
  status: 'loaded',

  snapshot(){
    const api = window.XIARA_CONTEXT_API;
    let db1 = null, db2 = null, xiara = null;

    try { db1 = api?.getDb?.() || null; } catch(_e){}
    try { db2 = api?.getDb?.() || null; } catch(_e){}
    try { xiara = api?.getXIARA?.() || window.XIARA || null; } catch(_e){}

    const checks = [
      ['Context API', !!api],
      ['Modelo db accesible', !!db1],
      ['Referencia db estable', !!db1 && db1 === db2],
      ['XIARA core', !!xiara],
      ['Firestore service', !!xiara?.dbService],
      ['Storage service', !!xiara?.storageService],
      ['Documents service', !!xiara?.documents],
      ['Render bridge', typeof api?.renderAll === 'function'],
      ['Save bridge', typeof api?.safeLocalSave === 'function'],
      ['Login disponible', typeof window.login === 'function'],
      ['Integridad documental disponible', typeof window.xiaraDocumentIntegrityScan === 'function'],
      ['Preflight V6.2 disponible', typeof window.xiaraV62Preflight === 'function']
    ];

    return {
      ok: checks.every(x => x[1]),
      checks,
      dbSameReference: !!db1 && db1 === db2,
      companyId: (() => {
        try { return api?.getCompanyId?.() || null; } catch(_e){ return null; }
      })(),
      activeListeners: window.XIARA_PERF?.activeSnapshotListeners || 0,
      runtimeErrors: window.XIARA_DIAG?.errors?.length || 0,
      rejectedPromises: window.XIARA_DIAG?.rejections?.length || 0,
      operationFailures: window.XIARA_OPS?.failures?.length || 0
    };
  }
};

window.XIARA_V62_MODULES.architecture = contract;

window.xiaraV62ArchitectureAudit = function(){
  const result = contract.snapshot();
  window.XIARA_V62_ARCHITECTURE_AUDIT = {
    ...result,
    checkedAt: new Date().toISOString()
  };

  alert(
    (result.ok ? 'ARQUITECTURA V6.2 OK' : 'ARQUITECTURA V6.2 REVISAR') +
    '\n\n' +
    result.checks.map(([name, ok]) => (ok ? 'OK  ' : 'FALLO  ') + name).join('\n') +
    '\n\nEmpresa activa: ' + (result.companyId || 'sin resolver') +
    '\nListeners activos: ' + result.activeListeners +
    '\nErrores runtime: ' + result.runtimeErrors +
    '\nPromesas rechazadas: ' + result.rejectedPromises +
    '\nFallos de operación: ' + result.operationFailures
  );

  return window.XIARA_V62_ARCHITECTURE_AUDIT;
};

window.xiaraV62SafeExtractionGate = function(){
  const arch = contract.snapshot();
  const perf = window.XIARA_V62_PERF || {};
  const duplicateNames = Array.isArray(perf.staticDuplicateFunctions)
    ? perf.staticDuplicateFunctions.length
    : 0;

  const gate = {
    ok: arch.ok &&
        arch.runtimeErrors === 0 &&
        arch.rejectedPromises === 0 &&
        arch.operationFailures === 0,
    architecture: arch,
    duplicateFunctionNamesInformational: duplicateNames,
    policy: 'No extraer código existente hasta disponer de límites funcionales explícitos.'
  };

  window.XIARA_V62_EXTRACTION_GATE = gate;

  alert(
    (gate.ok ? 'GATE MODULAR V6.2 APROBADO' : 'GATE MODULAR V6.2 BLOQUEADO') +
    '\n\nArquitectura: ' + (arch.ok ? 'OK' : 'REVISAR') +
    '\nErrores runtime: ' + arch.runtimeErrors +
    '\nPromesas rechazadas: ' + arch.rejectedPromises +
    '\nFallos de operación: ' + arch.operationFailures +
    '\nDuplicidades estáticas informativas: ' + duplicateNames +
    '\n\nNo se ha eliminado ni movido ninguna función de negocio.'
  );

  return gate;
};

})();

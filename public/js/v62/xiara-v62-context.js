/* XIARA V6.2 — Context consumer
   Preparatory module for future safe extraction.
*/
(function(){
'use strict';
window.XIARA_V62_MODULES=window.XIARA_V62_MODULES||{};

function snapshot(){
  const api=window.XIARA_CONTEXT_API;
  const db=api?.getDb?.();
  const xiara=api?.getXIARA?.();
  return {
    context:!!api,
    db:!!db,
    xiara:!!xiara,
    dbService:!!xiara?.dbService,
    storageService:!!xiara?.storageService,
    documents:!!xiara?.documents,
    companyId:api?.getCompanyId?.()||null
  };
}

window.XIARA_V62_MODULES.context={
  version:'6.2.0',
  loadedAt:new Date().toISOString(),
  status:'loaded',
  snapshot
};

window.xiaraV62ContextStatus=function(){
  const s=snapshot();
  const ok=s.context&&s.db&&s.xiara&&s.dbService&&s.storageService&&s.documents;
  window.XIARA_V62_CONTEXT_STATUS={ok,...s,checkedAt:new Date().toISOString()};
  alert(
    (ok?'CONTEXTO V6.2 OK':'CONTEXTO V6.2 REVISAR')+'\n\n'+
    'Context API: '+(s.context?'OK':'FALLO')+'\n'+
    'Modelo db: '+(s.db?'OK':'FALLO')+'\n'+
    'XIARA core: '+(s.xiara?'OK':'FALLO')+'\n'+
    'Firestore service: '+(s.dbService?'OK':'FALLO')+'\n'+
    'Storage service: '+(s.storageService?'OK':'FALLO')+'\n'+
    'Documents service: '+(s.documents?'OK':'FALLO')+'\n'+
    'Empresa activa: '+(s.companyId||'sin resolver')
  );
  return window.XIARA_V62_CONTEXT_STATUS;
};
})();
